import { useState } from "react";
import { motion } from "framer-motion";
import { CheckCircle, XCircle, RefreshCw, ExternalLink, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Integration {
  name: string; description: string; connected: boolean; lastSync: string; icon: string;
}

const initialIntegrations: Integration[] = [
  { name: "Tally", description: "Accounting & bookkeeping", connected: true, lastSync: "2 hours ago", icon: "T" },
  { name: "Zoho Books", description: "Invoice management", connected: true, lastSync: "30 min ago", icon: "Z" },
  { name: "HRMS Portal", description: "Employee management", connected: true, lastSync: "1 hour ago", icon: "H" },
  { name: "GSTN", description: "GST Network portal", connected: true, lastSync: "15 min ago", icon: "G" },
  { name: "MCA21", description: "Ministry of Corporate Affairs", connected: false, lastSync: "—", icon: "M" },
  { name: "EPFO", description: "Provident Fund portal", connected: true, lastSync: "4 hours ago", icon: "E" },
];

export default function Integrations() {
  const [integrations, setIntegrations] = useState(initialIntegrations);
  const [syncing, setSyncing] = useState<string | null>(null);
  const [connecting, setConnecting] = useState<string | null>(null);
  const { toast } = useToast();

  const toggleConnection = (name: string) => {
    const int = integrations.find(i => i.name === name)!;
    if (int.connected) {
      setIntegrations(prev => prev.map(i => i.name === name ? { ...i, connected: false, lastSync: "—" } : i));
      toast({ title: `${name} disconnected`, description: `${name} integration has been disconnected.` });
    } else {
      setConnecting(name);
      setTimeout(() => {
        setIntegrations(prev => prev.map(i => i.name === name ? { ...i, connected: true, lastSync: "Just now" } : i));
        setConnecting(null);
        toast({ title: `${name} connected`, description: `${name} integration is now active.` });
      }, 1500);
    }
  };

  const syncIntegration = (name: string) => {
    setSyncing(name);
    setTimeout(() => {
      setIntegrations(prev => prev.map(i => i.name === name ? { ...i, lastSync: "Just now" } : i));
      setSyncing(null);
      toast({ title: "Sync complete", description: `${name} data has been synced successfully.` });
    }, 2000);
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Integrations</h1>
        <p className="text-sm text-muted-foreground mt-1">Connect your business tools for automated compliance tracking</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {integrations.map((int, i) => (
          <motion.div
            key={int.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className="glass-card-hover p-5"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                  {int.icon}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">{int.name}</p>
                  <p className="text-xs text-muted-foreground">{int.description}</p>
                </div>
              </div>
              {int.connected ? (
                <CheckCircle className="h-5 w-5 text-success" />
              ) : (
                <XCircle className="h-5 w-5 text-muted-foreground" />
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-xs text-muted-foreground">
                {int.connected ? (
                  <button onClick={() => syncIntegration(int.name)} disabled={syncing === int.name} className="flex items-center gap-1 hover:text-foreground transition-colors">
                    {syncing === int.name ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                    {syncing === int.name ? "Syncing..." : `Last sync: ${int.lastSync}`}
                  </button>
                ) : (
                  "Not connected"
                )}
              </div>
              <button
                onClick={() => toggleConnection(int.name)}
                disabled={connecting === int.name}
                className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors flex items-center gap-1 ${
                  int.connected
                    ? "border border-border text-muted-foreground hover:bg-secondary"
                    : "gradient-primary text-primary-foreground"
                }`}
              >
                {connecting === int.name ? (
                  <><Loader2 className="h-3 w-3 animate-spin" /> Connecting...</>
                ) : int.connected ? (
                  <>Disconnect</>
                ) : (
                  <>Connect <ExternalLink className="h-3 w-3" /></>
                )}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
