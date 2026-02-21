import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Building, Bell, Shield, Palette, ChevronRight, Save, Check, Users } from "lucide-react";
import { useTheme } from "@/components/ThemeProvider";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import ManageUsers from "@/components/ManageUsers";
import RoleGuard from "@/components/RoleGuard";

interface Section { id: string; icon: React.ElementType; title: string; description: string; adminOnly?: boolean }

const sections: Section[] = [
  { id: "profile", icon: User, title: "Profile", description: "Manage your personal information" },
  { id: "company", icon: Building, title: "Company", description: "Update company details and registration" },
  { id: "manage-users", icon: Users, title: "Manage Users", description: "Add or remove team members", adminOnly: true },
  { id: "notifications", icon: Bell, title: "Notifications", description: "Configure alert preferences" },
  { id: "security", icon: Shield, title: "Security", description: "Password, 2FA, and session management" },
  { id: "appearance", icon: Palette, title: "Appearance", description: "Theme and display preferences" },
];

export default function SettingsPage() {
  const [activeSection, setActiveSection] = useState<string | null>(null);
  const { theme, toggleTheme } = useTheme();
  const { profile, setProfile, company, setCompany, accentColor, setAccentColor, accentPresets } = useSettings();
  const { role, hasPermission } = useAuth();
  const { toast } = useToast();

  const [notifications, setNotifications] = useState({ email: true, sms: false, deadlineReminder: true, riskAlerts: true, newsUpdates: false, weeklyReport: true });
  const [twoFA, setTwoFA] = useState(false);

  const handleSave = (section: string) => {
    toast({ title: "Settings saved", description: `${section} settings updated successfully.`, variant: "success" });
  };

  const toggle = (id: string) => setActiveSection(activeSection === id ? null : id);

  // Filter sections based on role
  const visibleSections = sections.filter(s => {
    if (s.adminOnly && role !== "admin") return false;
    return true;
  });

  const renderContent = (id: string) => {
    switch (id) {
      case "profile":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">First Name</label>
                <input value={profile.firstName} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Last Name</label>
                <input value={profile.lastName} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Email</label>
              <input value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Phone</label>
              <input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
            </div>
            <button onClick={() => handleSave("Profile")} className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground"><Save className="h-4 w-4" /> Save Changes</button>
          </div>
        );
      case "company":
        return (
          <RoleGuard permission="manageCompanyProfile">
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Company Name</label>
                <input value={company.name} onChange={e => setCompany(c => ({ ...c, name: e.target.value }))} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">GSTIN</label>
                  <input value={company.gstin} onChange={e => setCompany(c => ({ ...c, gstin: e.target.value }))} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">CIN</label>
                  <input value={company.cin} onChange={e => setCompany(c => ({ ...c, cin: e.target.value }))} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">State</label>
                  <input value={company.state} onChange={e => setCompany(c => ({ ...c, state: e.target.value }))} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">No. of Employees</label>
                  <input value={company.employees} onChange={e => setCompany(c => ({ ...c, employees: e.target.value }))} className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
                </div>
              </div>
              <button onClick={() => handleSave("Company")} className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground"><Save className="h-4 w-4" /> Save Changes</button>
            </div>
          </RoleGuard>
        );
      case "manage-users":
        return <ManageUsers />;
      case "notifications":
        return (
          <RoleGuard permission="modifySettings" fallback={
            <div className="space-y-3">
              {([
                { key: "email" as const, label: "Email Notifications", desc: "Receive compliance alerts via email" },
                { key: "deadlineReminder" as const, label: "Deadline Reminders", desc: "Reminders 3 days before deadlines" },
              ]).map(item => (
                <div key={item.key} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3 opacity-60">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch checked={notifications[item.key]} disabled />
                </div>
              ))}
              <p className="text-xs text-muted-foreground italic">Contact your admin to modify notification settings</p>
            </div>
          }>
            <div className="space-y-3">
              {([
                { key: "email" as const, label: "Email Notifications", desc: "Receive compliance alerts via email" },
                { key: "sms" as const, label: "SMS Notifications", desc: "Get urgent alerts via SMS" },
                { key: "deadlineReminder" as const, label: "Deadline Reminders", desc: "Reminders 3 days before deadlines" },
                { key: "riskAlerts" as const, label: "Risk Alerts", desc: "Instant alerts for high-risk items" },
                { key: "newsUpdates" as const, label: "News Updates", desc: "Daily regulatory news digest" },
                { key: "weeklyReport" as const, label: "Weekly Report", desc: "Weekly compliance summary email" },
              ]).map(item => (
                <div key={item.key} className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.desc}</p>
                  </div>
                  <Switch
                    checked={notifications[item.key]}
                    onCheckedChange={(checked) => setNotifications(n => ({ ...n, [item.key]: checked }))}
                  />
                </div>
              ))}
              <button onClick={() => handleSave("Notification")} className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground mt-2"><Save className="h-4 w-4" /> Save Preferences</button>
            </div>
          </RoleGuard>
        );
      case "security":
        return (
          <RoleGuard permission="modifySettings" fallback={
            <p className="text-sm text-muted-foreground">Contact your admin to manage security settings.</p>
          }>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Current Password</label>
                <input type="password" placeholder="••••••••" className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">New Password</label>
                <input type="password" placeholder="Min 8 characters" className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Confirm New Password</label>
                <input type="password" placeholder="Re-enter password" className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50" />
              </div>
              <button onClick={() => handleSave("Password")} className="flex items-center gap-2 rounded-lg gradient-primary px-4 py-2 text-sm font-medium text-primary-foreground"><Save className="h-4 w-4" /> Update Password</button>
              <div className="border-t border-border pt-4">
                <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-3">
                  <div>
                    <p className="text-sm font-medium text-foreground">Two-Factor Authentication</p>
                    <p className="text-xs text-muted-foreground">Add extra security to your account</p>
                  </div>
                  <Switch
                    checked={twoFA}
                    onCheckedChange={(checked) => {
                      setTwoFA(checked);
                      toast({ title: checked ? "2FA Enabled" : "2FA Disabled", description: checked ? "Two-factor authentication is now active." : "Two-factor authentication has been disabled.", variant: "warning" });
                    }}
                  />
                </div>
              </div>
              <div className="rounded-lg bg-secondary/50 p-3">
                <p className="text-sm font-medium text-foreground mb-1">Active Sessions</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Chrome · Windows · Mumbai</span>
                    <span className="text-success flex items-center gap-1"><Check className="h-3 w-3" /> Current</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">Safari · iPhone · Pune</span>
                    <button className="text-destructive hover:underline">Revoke</button>
                  </div>
                </div>
              </div>
            </div>
          </RoleGuard>
        );
      case "appearance":
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg bg-secondary/50 p-4">
              <div>
                <p className="text-sm font-medium text-foreground">Theme</p>
                <p className="text-xs text-muted-foreground">Switch between light and dark mode</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { if (theme === "dark") toggleTheme(); }} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${theme === "light" ? "gradient-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-secondary"}`}>Light</button>
                <button onClick={() => { if (theme === "light") toggleTheme(); }} className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${theme === "dark" ? "gradient-primary text-primary-foreground" : "border border-border text-muted-foreground hover:bg-secondary"}`}>Dark</button>
              </div>
            </div>
            <div className="rounded-lg bg-secondary/50 p-4">
              <p className="text-sm font-medium text-foreground mb-2">Accent Color</p>
              <div className="flex gap-3">
                {accentPresets.map(preset => (
                  <button
                    key={preset.hsl}
                    className={`h-8 w-8 rounded-full border-2 transition-colors ${accentColor === preset.hsl ? "border-foreground scale-110" : "border-transparent hover:border-foreground/50"}`}
                    style={{ background: `hsl(${preset.hsl})` }}
                    onClick={() => {
                      setAccentColor(preset.hsl);
                      toast({ title: "Accent color changed", description: `${preset.label} accent applied.`, variant: "success" });
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  const roleLabel = role === "admin" ? "Admin" : role === "finance" ? "Finance / Tax User" : "Read-Only Auditor";
  const roleDesc = role === "admin" ? "Full access to all compliance features and settings" : role === "finance" ? "Can view dashboard, upload documents, and run checks" : "Read-only access to dashboard and reports";

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage your account and application preferences</p>
      </div>

      <div className="space-y-3">
        {visibleSections.map((s, i) => (
          <div key={s.id}>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.08 }}
              onClick={() => toggle(s.id)}
              className="glass-card-hover p-5 flex items-center gap-4 cursor-pointer"
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <s.icon className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-semibold text-foreground">{s.title}</p>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
              <ChevronRight className={`h-5 w-5 text-muted-foreground transition-transform ${activeSection === s.id ? "rotate-90" : ""}`} />
            </motion.div>
            <AnimatePresence>
              {activeSection === s.id && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="glass-card p-5 mt-1 ml-4 border-l-2 border-primary/30">
                    {renderContent(s.id)}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ))}
      </div>

      {/* Role badge */}
      <div className="glass-card p-5">
        <h3 className="text-sm font-semibold text-foreground mb-3">Access Level</h3>
        <div className="flex items-center gap-3">
          <span className="rounded-full gradient-primary px-3 py-1 text-xs font-semibold text-primary-foreground">{roleLabel}</span>
          <span className="text-xs text-muted-foreground">{roleDesc}</span>
        </div>
      </div>
    </motion.div>
  );
}
