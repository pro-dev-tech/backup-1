import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield, Lock, Upload, Download, Trash2, FileText, Image, File,
  Eye, EyeOff, KeyRound, HardDrive, AlertTriangle, Check
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { encryptData, decryptData, hashPassword, isValidVaultPassword } from "@/lib/encryption";
import { saveFile, getAllFiles, getFile, deleteFile, getTotalSize, type VaultFile } from "@/lib/vaultStorage";

const STORAGE_LIMITS: Record<string, number> = {
  admin: 25 * 1024 * 1024,     // 25 MB
  finance: 25 * 1024 * 1024,   // 25 MB
  auditor: 0,                   // No access
};

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
}

function getFileIcon(type: string) {
  if (type.startsWith("image/")) return Image;
  if (type.includes("pdf") || type.includes("document") || type.includes("text")) return FileText;
  return File;
}

export default function SecureVault() {
  const { role } = useAuth();
  const { toast } = useToast();

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [vaultPassword, setVaultPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSetup, setIsSetup] = useState(false);
  const [setupPassword, setSetupPassword] = useState("");
  const [setupConfirm, setSetupConfirm] = useState("");
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [totalSize, setTotalSize] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const storageLimit = STORAGE_LIMITS[role] || 0;

  // Check if vault is set up (password hash stored)
  useEffect(() => {
    const hash = localStorage.getItem("vault_password_hash");
    setIsSetup(!!hash);
  }, []);

  const loadFiles = useCallback(async () => {
    const allFiles = await getAllFiles();
    setFiles(allFiles);
    const size = await getTotalSize();
    setTotalSize(size);
  }, []);

  // No access for auditor
  if (role === "auditor") {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-destructive/10 flex items-center justify-center">
          <Lock className="h-8 w-8 text-destructive" />
        </div>
        <h2 className="text-xl font-bold text-foreground">Access Denied</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          Auditor accounts do not have access to the Secure Vault. Contact your administrator for access.
        </p>
      </motion.div>
    );
  }

  // Setup vault password
  const handleSetup = () => {
    setError("");
    if (!isValidVaultPassword(setupPassword)) {
      setError("Password must be 8-20 characters");
      return;
    }
    if (setupPassword !== setupConfirm) {
      setError("Passwords do not match");
      return;
    }
    localStorage.setItem("vault_password_hash", hashPassword(setupPassword));
    setIsSetup(true);
    setVaultPassword(setupPassword);
    setIsUnlocked(true);
    loadFiles();
    toast({ title: "Vault Created", description: "Your secure vault is ready. Remember your password!", variant: "success" });
  };

  // Unlock vault
  const handleUnlock = () => {
    setError("");
    const storedHash = localStorage.getItem("vault_password_hash");
    if (hashPassword(vaultPassword) === storedHash) {
      setIsUnlocked(true);
      loadFiles();
    } else {
      setError("Incorrect vault password");
    }
  };

  // Upload file
  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploading(true);

    for (const file of Array.from(fileList)) {
      if (totalSize + file.size > storageLimit) {
        toast({
          title: "Storage Limit Exceeded",
          description: `Cannot upload ${file.name}. You have ${formatSize(storageLimit - totalSize)} remaining.`,
          variant: "destructive",
        });
        continue;
      }

      try {
        const arrayBuffer = await file.arrayBuffer();
        const encrypted = encryptData(arrayBuffer, vaultPassword);

        const vaultFile: VaultFile = {
          id: `vault-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          name: file.name,
          size: file.size,
          encryptedSize: encrypted.length,
          type: file.type,
          uploadedAt: new Date().toISOString(),
          encryptedData: encrypted,
        };

        await saveFile(vaultFile);
        toast({ title: "File Encrypted & Stored", description: `${file.name} secured with AES-256 encryption.`, variant: "success" });
      } catch {
        toast({ title: "Upload Failed", description: `Failed to encrypt ${file.name}.`, variant: "destructive" });
      }
    }

    await loadFiles();
    setUploading(false);
    e.target.value = "";
  };

  // Download file
  const handleDownload = async (id: string) => {
    try {
      const file = await getFile(id);
      if (!file) return;

      const decrypted = decryptData(file.encryptedData, vaultPassword);
      const blob = new Blob([decrypted], { type: file.type });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = file.name;
      a.click();
      URL.revokeObjectURL(url);

      toast({ title: "File Decrypted", description: `${file.name} downloaded successfully.` });
    } catch {
      toast({ title: "Decryption Failed", description: "Could not decrypt file. Password may be incorrect.", variant: "destructive" });
    }
  };

  // Delete file
  const handleDelete = async (id: string, name: string) => {
    await deleteFile(id);
    await loadFiles();
    toast({ title: "File Deleted", description: `${name} removed from vault.` });
  };

  const usagePercent = storageLimit > 0 ? Math.min((totalSize / storageLimit) * 100, 100) : 0;

  // Vault setup screen
  if (!isSetup) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto mt-20">
        <div className="glass-card p-8 text-center space-y-6">
          <div className="h-16 w-16 rounded-2xl gradient-primary flex items-center justify-center mx-auto">
            <Shield className="h-8 w-8 text-primary-foreground" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Create Secure Vault</h2>
            <p className="text-sm text-muted-foreground mt-1">Set a password to encrypt your confidential documents with AES-256 encryption</p>
          </div>

          <div className="space-y-3 text-left">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Vault Password (8-20 characters)</label>
              <input
                type="password"
                value={setupPassword}
                onChange={e => setSetupPassword(e.target.value)}
                placeholder="Enter vault password"
                className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Confirm Password</label>
              <input
                type="password"
                value={setupConfirm}
                onChange={e => setSetupConfirm(e.target.value)}
                placeholder="Re-enter password"
                className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex items-center gap-2 text-xs text-muted-foreground bg-warning/10 border border-warning/30 rounded-lg p-3">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0" />
            <span>If you forget your vault password, your files cannot be recovered. There is no password reset.</span>
          </div>

          <button
            onClick={handleSetup}
            disabled={!setupPassword || !setupConfirm}
            className="w-full rounded-lg gradient-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Lock className="h-4 w-4" /> Create Vault
          </button>
        </div>
      </motion.div>
    );
  }

  // Unlock screen
  if (!isUnlocked) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-md mx-auto mt-20">
        <div className="glass-card p-8 text-center space-y-6">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <KeyRound className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Unlock Vault</h2>
            <p className="text-sm text-muted-foreground mt-1">Enter your vault password to access encrypted files</p>
          </div>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              value={vaultPassword}
              onChange={e => setVaultPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleUnlock()}
              placeholder="Vault password"
              className="w-full rounded-lg border border-border bg-secondary px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 pr-10"
            />
            <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>

          {error && (
            <div className="rounded-lg bg-destructive/10 border border-destructive/30 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}

          <button
            onClick={handleUnlock}
            disabled={!vaultPassword}
            className="w-full rounded-lg gradient-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <Lock className="h-4 w-4" /> Unlock
          </button>
        </div>
      </motion.div>
    );
  }

  // Main vault view
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-lg gradient-primary flex items-center justify-center">
            <Shield className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Secure Vault</h1>
            <p className="text-xs text-muted-foreground">AES-256 encrypted • End-to-end secure</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-[10px] font-semibold text-success">
            <Check className="h-3 w-3" /> Encrypted
          </span>
          <button
            onClick={() => { setIsUnlocked(false); setVaultPassword(""); }}
            className="rounded-lg border border-border p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            title="Lock vault"
          >
            <Lock className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Storage Usage */}
      <div className="glass-card p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2 text-sm">
            <HardDrive className="h-4 w-4 text-primary" />
            <span className="font-medium text-foreground">Storage</span>
          </div>
          <span className="text-xs text-muted-foreground">
            {formatSize(totalSize)} / {formatSize(storageLimit)}
          </span>
        </div>
        <div className="w-full h-2 rounded-full bg-secondary overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${usagePercent}%` }}
            className={`h-full rounded-full ${usagePercent > 90 ? "bg-destructive" : usagePercent > 70 ? "bg-warning" : "bg-primary"}`}
          />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1.5">{files.length} file{files.length !== 1 ? "s" : ""} • {role === "admin" ? "Admin" : "Finance"} tier (25 MB)</p>
      </div>

      {/* Upload */}
      <label className={`glass-card-hover p-6 flex flex-col items-center justify-center gap-3 cursor-pointer border-2 border-dashed border-primary/20 hover:border-primary/40 transition-colors ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
        <Upload className="h-8 w-8 text-primary" />
        <div className="text-center">
          <p className="text-sm font-medium text-foreground">{uploading ? "Encrypting & storing..." : "Click to upload files"}</p>
          <p className="text-xs text-muted-foreground mt-0.5">Files are encrypted with AES-256 before storage</p>
        </div>
        <input type="file" multiple onChange={handleUpload} className="hidden" />
      </label>

      {/* File List */}
      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Vault Files</h3>
        {files.length === 0 ? (
          <div className="glass-card p-8 text-center">
            <FileText className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">No files in vault. Upload your first file to get started.</p>
          </div>
        ) : (
          <AnimatePresence>
            {files.map((file) => {
              const FileIcon = getFileIcon(file.type);
              return (
                <motion.div
                  key={file.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="glass-card-hover p-4 flex items-center gap-3"
                >
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <FileIcon className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{file.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(file.size)} • {new Date(file.uploadedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => handleDownload(file.id)}
                      className="rounded-lg p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                      title="Download & decrypt"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(file.id, file.name)}
                      className="rounded-lg p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                      title="Delete file"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Security Info */}
      <div className="glass-card p-4 space-y-2">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" /> Security Details
        </h3>
        <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2"><Check className="h-3 w-3 text-success" /> AES-256 Encryption</div>
          <div className="flex items-center gap-2"><Check className="h-3 w-3 text-success" /> End-to-End Encrypted</div>
          <div className="flex items-center gap-2"><Check className="h-3 w-3 text-success" /> Password Protected</div>
          <div className="flex items-center gap-2"><Check className="h-3 w-3 text-success" /> Local Storage Only</div>
        </div>
      </div>
    </motion.div>
  );
}
