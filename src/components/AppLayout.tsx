import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Calendar, ShieldAlert, Bot, Plug, FileBarChart,
  Settings, Bell, ChevronDown, Shield, Lock, ClipboardList,
  Menu, X, LogOut, Sun, Moon
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTheme } from "@/components/ThemeProvider";
import { useIsMobile } from "@/hooks/use-mobile";

const navItems = [
  { title: "Dashboard", icon: LayoutDashboard, path: "/dashboard" },
  { title: "Compliance Calendar", icon: Calendar, path: "/calendar" },
  { title: "Risk Monitor", icon: ShieldAlert, path: "/risk-monitor" },
  { title: "AI Assistant", icon: Bot, path: "/ai-assistant" },
  { title: "Integrations", icon: Plug, path: "/integrations" },
  { title: "Reports", icon: FileBarChart, path: "/reports" },
  { title: "Settings", icon: Settings, path: "/settings" },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [profileOpen, setProfileOpen] = useState(false);

  // Close sidebar on mobile when route changes
  useEffect(() => {
    if (isMobile) setSidebarOpen(false);
  }, [location.pathname, isMobile]);

  // Sync sidebar state when breakpoint changes
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
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-lg font-bold gradient-primary-text whitespace-nowrap"
            >
              ComplianceAI
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

            {/* Company selector - hidden on very small screens */}
            <button className="hidden sm:flex items-center gap-2 rounded-lg border border-border bg-secondary px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted transition-colors">
              <div className="h-5 w-5 rounded bg-primary/20 flex items-center justify-center text-xs text-primary font-bold">A</div>
              <span>Acme Pvt Ltd</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>

          <div className="flex items-center gap-2 md:gap-3">
            {/* Risk score badge - compact on mobile */}
            <div className="hidden sm:flex items-center gap-2 rounded-full border border-success/30 bg-success/10 px-3 py-1 text-xs font-semibold text-success">
              <Shield className="h-3.5 w-3.5" />
              Risk Score: 82/100
            </div>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors"
              aria-label="Toggle theme"
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>

            {/* Notifications */}
            <button className="relative rounded-lg p-2 text-muted-foreground hover:bg-secondary transition-colors">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground flex items-center justify-center">
                3
              </span>
            </button>

            {/* Profile */}
            <div className="relative">
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-secondary transition-colors"
              >
                <div className="h-8 w-8 rounded-full gradient-primary flex items-center justify-center text-sm font-bold text-primary-foreground">
                  RA
                </div>
                <div className="text-left hidden lg:block">
                  <p className="text-sm font-medium text-foreground">Rahul A.</p>
                  <p className="text-xs text-muted-foreground">Admin</p>
                </div>
              </button>
              <AnimatePresence>
                {profileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="absolute right-0 top-12 w-48 rounded-xl border border-border bg-card p-2 shadow-xl"
                  >
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/settings"); }}
                      className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors"
                    >
                      <Settings className="h-4 w-4" /> Settings
                    </button>
                    <button
                      onClick={() => { setProfileOpen(false); navigate("/login"); }}
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
