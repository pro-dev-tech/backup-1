import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { UserPlus, Trash2, Eye, EyeOff, ToggleLeft, ToggleRight } from "lucide-react";
import PasswordStrength from "@/components/PasswordStrength";
import type { ManagedUser } from "@/backend/types";

const inputCls = "w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50";
const labelCls = "text-xs font-medium text-muted-foreground mb-1 block";

export default function ManageUsers() {
  const { managedUsers, addManagedUser, removeManagedUser, toggleManagedUser } = useAuth();
  const { toast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [role, setRole] = useState<"finance" | "auditor">("finance");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const resetForm = () => {
    setFirstName(""); setLastName(""); setEmail(""); setPhone("");
    setPassword(""); setConfirmPw(""); setShowPw(false); setErrors({});
  };

  const handleAdd = () => {
    const e: Record<string, string> = {};
    if (!firstName.trim()) e.firstName = "Required";
    if (!email.trim()) e.email = "Required";
    if (!phone.trim()) e.phone = "Required";
    if (!password || password.length < 8) e.password = "Min 8 characters";
    if (password !== confirmPw) e.confirmPw = "Passwords don't match";
    if (managedUsers.find(u => u.email === email)) e.email = "Email already exists";
    setErrors(e);
    if (Object.keys(e).length > 0) return;

    addManagedUser({ firstName, lastName, email, phone, role });
    toast({ title: "User Added", description: `${firstName} added as ${role === "finance" ? "Finance/Tax User" : "Auditor"}`, variant: "success" });
    resetForm();
    setShowForm(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-foreground">Manage Team Members</p>
          <p className="text-xs text-muted-foreground">Add or remove Finance/Tax Users and Auditors</p>
        </div>
        <button onClick={() => { setShowForm(!showForm); resetForm(); }} className="flex items-center gap-1.5 rounded-lg gradient-primary px-3 py-2 text-xs font-medium text-primary-foreground">
          <UserPlus className="h-3.5 w-3.5" /> Add User
        </button>
      </div>

      {showForm && (
        <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
          <div>
            <label className={labelCls}>Role</label>
            <select value={role} onChange={e => setRole(e.target.value as "finance" | "auditor")} className={`${inputCls} appearance-none`}>
              <option value="finance">Finance / Tax User</option>
              <option value="auditor">Read-Only Auditor</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>First Name *</label>
              <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" className={inputCls} />
              {errors.firstName && <p className="text-xs text-destructive mt-0.5">{errors.firstName}</p>}
            </div>
            <div>
              <label className={labelCls}>Last Name</label>
              <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" className={inputCls} />
            </div>
          </div>
          <div>
            <label className={labelCls}>Email *</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="user@company.com" className={inputCls} />
            {errors.email && <p className="text-xs text-destructive mt-0.5">{errors.email}</p>}
          </div>
          <div>
            <label className={labelCls}>Mobile *</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98765 43210" className={inputCls} />
            {errors.phone && <p className="text-xs text-destructive mt-0.5">{errors.phone}</p>}
          </div>
          <div>
            <label className={labelCls}>Password *</label>
            <div className="relative">
              <input type={showPw ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 8 characters" className={`${inputCls} pr-10`} />
              <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
            </div>
            <PasswordStrength password={password} />
            {errors.password && <p className="text-xs text-destructive mt-0.5">{errors.password}</p>}
          </div>
          <div>
            <label className={labelCls}>Confirm Password *</label>
            <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Re-enter" className={inputCls} />
            {errors.confirmPw && <p className="text-xs text-destructive mt-0.5">{errors.confirmPw}</p>}
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex-1 rounded-lg gradient-primary py-2 text-xs font-medium text-primary-foreground">Add User</button>
            <button onClick={() => { setShowForm(false); resetForm(); }} className="flex-1 rounded-lg border border-border py-2 text-xs font-medium text-foreground hover:bg-secondary">Cancel</button>
          </div>
        </div>
      )}

      {/* Users list */}
      {managedUsers.length === 0 ? (
        <div className="text-center py-8 text-sm text-muted-foreground">
          No team members added yet
        </div>
      ) : (
        <div className="space-y-2">
          {managedUsers.map(u => (
            <div key={u.id} className={`flex items-center justify-between rounded-lg bg-secondary/50 p-3 ${!u.active ? "opacity-50" : ""}`}>
              <div>
                <p className="text-sm font-medium text-foreground">{u.firstName} {u.lastName}</p>
                <p className="text-xs text-muted-foreground">{u.email} · {u.role === "finance" ? "Finance/Tax User" : "Auditor"}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleManagedUser(u.id)} className="text-muted-foreground hover:text-foreground" title={u.active ? "Deactivate" : "Activate"}>
                  {u.active ? <ToggleRight className="h-5 w-5 text-success" /> : <ToggleLeft className="h-5 w-5" />}
                </button>
                <button onClick={() => { removeManagedUser(u.id); toast({ title: "User Removed", variant: "warning" }); }} className="text-muted-foreground hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
