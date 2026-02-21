import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Calendar, ShieldAlert, Bot, Plug, FileBarChart,
  Settings, Bell, ChevronDown, Shield, Lock, ClipboardList, Newspaper,
  Menu, X, LogOut, Sun, Moon, Check
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { useSettings } from "@/contexts/SettingsContext";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { title: "Compliance Checker", icon: ClipboardList, path: "/compliance-checker" },
  { title: "News Feed", icon: Newspaper, path: "/news-feed" },
  { title: "Compliance Calendar", icon: Calendar, path: "/calendar" },
  { title: "Risk Monitor", icon: ShieldAlert, path: "/risk-monitor" },
  { title: "AI Assistant", icon: Bot, path: "/ai-assistant" },
  { title: "Integrations", icon: Plug, path: "/integrations" },
  { title: "Reports", icon: FileBarChart, path: "/reports" },
  { title: "Settings", icon: Settings, path: "/settings" },
];

// Companies are now derived from settings context

const demoNotifications = [
  { id: 1, text: "PF Return overdue by 2 days", time: "10 min ago", read: false },
  { id: 2, text: "New GST amendment notification", time: "1h ago", read: false },
  { id: 3, text: "ESIC threshold change for Karnataka", time: "3h ago", read: false },
  { id: 4, text: "GST-1 filed successfully", time: "5h ago", read: true },
  { id: 5, text: "Risk score improved to 82", time: "1d ago", read: true },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { profile, company } = useSettings();
  const { user, role, logout, isAuthenticated } = useAuth();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [companyOpen, setCompanyOpen] = useState(false);
  const [notifications, setNotifications] = useState(demoNotifications);

  useEffect(() => {
    if (!isAuthenticated) navigate("/login", { replace: true });
  }, [isAuthenticated, navigate]);

  const companyInitial = company.name.charAt(0).toUpperCase();
  const displayName = user ? `${user.firstName} ${user.lastName.charAt(0)}.` : `${profile.firstName} ${profile.lastName.charAt(0)}.`;
  const displayInitials = user ? `${user.firstName.charAt(0)}${user.lastName.charAt(0)}` : `${profile.firstName.charAt(0)}${profile.lastName.charAt(0)}`;
  const roleLabel = role === "admin" ? "Admin" : role === "finance" ? "Finance" : "Auditor";

  const unreadCount = notifications.filter(n => !n.read).length;

  const markAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const markRead = (id: number) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const close = () => { setProfileOpen(false); setNotifOpen(false); setCompanyOpen(false); };
    if (profileOpen || notifOpen || companyOpen) {
      const timer = setTimeout(() => document.addEventListener("click", close, { once: true }), 0);
      return () => clearTimeout(timer);
    }
  }, [profileOpen, notifOpen, companyOpen]);

  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  useEffect(() => {
    setSidebarOpen(!isMobile);
  }, [isMobile]);

  return (
    <div className="flex min-h-screen bg-background">
      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-30 bg-background/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-border bg-sidebar transition-all duration-300 ${
          isMobile
            ? sidebarOpen ? "w-64 translate-x-0" : "w-64 -translate-x-full"
            : sidebarOpen ? "w-64" : "w-16"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center gap-3 border-b border-border px-4">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg gradient-primary">
            <Shield className="h-4 w-4 text-primary-foreground" />
          </div>
          {(sidebarOpen || isMobile) && (
            <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-lg font-bold gradient-primary-text whitespace-nowrap">
              Nexus-Compliance
            </motion.span>
          )}
          {isMobile && sidebarOpen && (
            <button onClick={() => setSidebarOpen(false)} className="ml-auto p-1 text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 space-y-1 p-3 overflow-y-auto scrollbar-thin">
          {navItems.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 group ${
                  active
                    ? "bg-primary/10 text-primary glow-border"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
              >
                <item.icon className={`h-5 w-5 shrink-0 ${active ? "text-primary" : ""}`} />
                {(sidebarOpen || isMobile) && <span className="whitespace-nowrap">{item.title}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Security badges */}
        {(sidebarOpen || isMobile) && (
          <div className="border-t border-border p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Lock className="h-3.5 w-3.5 text-success" />
              <span>256-bit Encrypted</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <ClipboardList className="h-3.5 w-3.5 text-primary" />
              <span>Audit Trail Active</span>
            </div>
          </div>
        )}
      </aside>

      {/* Main area */}
      <div className={`flex-1 transition-all duration-300 ${
        isMobile ? "ml-0" : sidebarOpen ? "ml-64" : "ml-16"
      }`}>
        {/* Top bar */}
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/80 backdrop-blur-xl px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors"
            >
              {sidebarOpen && !isMobile ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>

            {/* Company selector */}
            <div className="relative hidden sm:block">
              <button
                onClick={(e) => { e.stopPropagation(); setCompanyOpen(!companyOpen); }}
                className="flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
              >
                <div className="h-5 w-5 rounded bg-primary/20 flex items-center justify-center text-xs text-primary font-bold">{companyInitial}</div>
                <span>{company.name}</span>
                <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${companyOpen ? "rotate-180" : ""}`} />
              </button>
              <AnimatePresence>
                {companyOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute left-0 top-10 w-56 rounded-xl border border-border bg-card p-1 shadow-xl z-50"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="px-3 py-2 text-xs text-muted-foreground font-medium">Current Company</div>
                    <div className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm bg-primary/10 text-primary">
                      <div className="h-6 w-6 rounded bg-primary/20 flex items-center justify-center text-xs text-primary font-bold">{companyInitial}</div>
                      <span>{company.name}</span>
                      <Check className="h-4 w-4 ml-auto" />
                    </div>
                    <div className="border-t border-border mt-1 pt-1">
                      <button
                        onClick={() => { setCompanyOpen(false); navigate("/settings"); }}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                      >
                        <Settings className="h-4 w-4 text-muted-foreground" />
                        <span>Edit Company Details</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Risk score badge */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
              <Shield className="h-3.5 w-3.5" />
              Risk Score: 82/100
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-200"
              aria-label="Toggle theme"
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setNotifOpen(!notifOpen); }}
                className="relative rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors"
              >
                <Bell className="h-5 w-5" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </button>
              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 top-12 w-80 rounded-xl border border-border bg-card shadow-xl z-50"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between p-3 border-b border-border">
                      <span className="text-sm font-semibold text-foreground">Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={markAllRead} className="text-xs text-primary hover:underline">Mark all read</button>
                      )}
                    </div>
                    <div className="max-h-72 overflow-y-auto divide-y divide-border">
                      {notifications.map(n => (
                        <button
                          key={n.id}
                          onClick={() => markRead(n.id)}
                          className={`w-full text-left px-3 py-3 hover:bg-secondary/50 transition-colors ${!n.read ? "bg-primary/5" : ""}`}
                        >
                          <div className="flex items-start gap-2">
                            {!n.read && <div className="h-2 w-2 rounded-full bg-primary mt-1.5 shrink-0" />}
                            <div className={!n.read ? "" : "ml-4"}>
                              <p className="text-sm text-foreground">{n.text}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{n.time}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); }}
                className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-secondary transition-colors"
              >
                <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                  {displayInitials}
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-medium text-foreground">{displayName}</p>
                  <p className="text-xs text-muted-foreground">{roleLabel}</p>
                </div>
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 top-12 w-48 rounded-xl border border-border bg-card p-2 shadow-xl z-50"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/settings"); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                      <Settings className="h-4 w-4" /> Settings
                    </button>
                    <button
                      onClick={() => { setProfileOpen(false); logout(); navigate("/login"); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-destructive hover:bg-secondary transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Logout
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 md:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
