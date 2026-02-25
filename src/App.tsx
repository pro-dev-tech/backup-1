import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/ThemeProvider";
import { SettingsProvider } from "@/contexts/SettingsContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { ChatProvider } from "@/contexts/ChatContext";
import AppLayout from "@/components/AppLayout";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import ForgotPassword from "@/pages/ForgotPassword";
import Dashboard from "@/pages/Dashboard";
import ComplianceCalendar from "@/pages/ComplianceCalendar";
import RiskMonitor from "@/pages/RiskMonitor";
import AIAssistant from "@/pages/AIAssistant";
import Integrations from "@/pages/Integrations";
import Reports from "@/pages/Reports";
import SettingsPage from "@/pages/Settings";
import ComplianceChecker from "@/pages/ComplianceChecker";
import RegulatoryNewsFeed from "@/pages/RegulatoryNewsFeed";
import SecureVault from "@/pages/SecureVault";
import NotFound from "@/pages/NotFound";
import Terms from "@/pages/Terms";
import Privacy from "@/pages/Privacy";
import LandingPage from "@/pages/LandingPage";
import Careers from "@/pages/Careers";
import Blog from "@/pages/Blog";
import DataProtection from "@/pages/DataProtection";
import Security from "@/pages/Security";
import HelpCenter from "@/pages/HelpCenter";
import Documentation from "@/pages/Documentation";
import LinkedInRedirect from "@/pages/LinkedInRedirect";
import TwitterRedirect from "@/pages/TwitterRedirect";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <ChatProvider>
          <SettingsProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<LandingPage />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/privacy" element={<Privacy />} />
                  <Route path="/careers" element={<Careers />} />
                  <Route path="/blog" element={<Blog />} />
                  <Route path="/data-protection" element={<DataProtection />} />
                  <Route path="/security" element={<Security />} />
                  <Route path="/help-center" element={<HelpCenter />} />
                  <Route path="/documentation" element={<Documentation />} />
                  <Route path="/linkedin" element={<LinkedInRedirect />} />
                  <Route path="/twitter" element={<TwitterRedirect />} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/compliance-checker" element={<ProtectedRoute><ComplianceChecker /></ProtectedRoute>} />
                  <Route path="/news-feed" element={<ProtectedRoute><RegulatoryNewsFeed /></ProtectedRoute>} />
                  <Route path="/calendar" element={<ProtectedRoute><ComplianceCalendar /></ProtectedRoute>} />
                  <Route path="/risk-monitor" element={<ProtectedRoute><RiskMonitor /></ProtectedRoute>} />
                  <Route path="/ai-assistant" element={<ProtectedRoute><AIAssistant /></ProtectedRoute>} />
                  <Route path="/integrations" element={<ProtectedRoute><Integrations /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
                  <Route path="/secure-vault" element={<ProtectedRoute><SecureVault /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </SettingsProvider>
        </ChatProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
