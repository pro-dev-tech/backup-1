// ============================================
// ComplianceAI – Backend Data Models
// ============================================

// ---- Auth ----
export type UserRole = "admin" | "finance" | "auditor";

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  company: Company;
  role: UserRole;
  createdAt: string;
}

export interface AuthSession {
  user: User;
  token: string;
  expiresAt: string;
}

export interface LoginPayload {
  email: string;
  password: string;
  role: UserRole;
}

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
  companyName: string;
  businessType: string;
  industryType: string;
  stateOfRegistration: string;
  pan: string;
  domainEmail?: string;
  gstin?: string;
  employeeCount?: string;
  annualTurnover?: string;
}

// ---- Company ----
export interface Company {
  name: string;
  gstin: string;
  cin: string;
  state: string;
  employees: string;
  businessType?: string;
  industryType?: string;
  pan?: string;
  annualTurnover?: string;
}

// ---- Permissions ----
export interface RolePermissions {
  manageCompanyProfile: boolean;
  manageUsers: boolean;
  assignRoles: boolean;
  enableNewsFeed: boolean;
  uploadDocuments: boolean;
  runComplianceChecks: boolean;
  viewAiInsights: boolean;
  downloadReports: boolean;
  modifySettings: boolean;
  viewDashboard: boolean;
  viewReports: boolean;
  viewNewsFeed: boolean;
  canChangeTheme: boolean;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  admin: {
    manageCompanyProfile: true,
    manageUsers: true,
    assignRoles: true,
    enableNewsFeed: true,
    uploadDocuments: true,
    runComplianceChecks: true,
    viewAiInsights: true,
    downloadReports: true,
    modifySettings: true,
    viewDashboard: true,
    viewReports: true,
    viewNewsFeed: true,
    canChangeTheme: true,
  },
  finance: {
    manageCompanyProfile: false,
    manageUsers: false,
    assignRoles: false,
    enableNewsFeed: false,
    uploadDocuments: true,
    runComplianceChecks: true,
    viewAiInsights: false,
    downloadReports: true,
    modifySettings: false,
    viewDashboard: true,
    viewReports: true,
    viewNewsFeed: true,
    canChangeTheme: true,
  },
  auditor: {
    manageCompanyProfile: false,
    manageUsers: false,
    assignRoles: false,
    enableNewsFeed: false,
    uploadDocuments: false,
    runComplianceChecks: false,
    viewAiInsights: false,
    downloadReports: true,
    modifySettings: false,
    viewDashboard: true,
    viewReports: true,
    viewNewsFeed: true,
    canChangeTheme: true,
  },
};

// ---- Managed Users ----
export interface ManagedUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: "finance" | "auditor";
  createdAt: string;
  active: boolean;
}

// ---- Dashboard ----
export interface DashboardStat {
  label: string;
  value: string;
  icon: string;
  change: string;
}

export interface DashboardData {
  stats: DashboardStat[];
  complianceScore: number;
  riskTrend: { month: string; value: number }[];
  filingStatus: { name: string; value: number }[];
  stateCompliance: { state: string; score: number }[];
  monthlyActivity: { month: string; filings: number; penalties: number }[];
}

// ---- Calendar ----
export interface CalendarEvent {
  id: string;
  day: number;
  month: number;
  year: number;
  title: string;
  status: "completed" | "upcoming" | "overdue";
  createdAt: string;
}

// ---- Compliance Checker ----
export interface ComplianceResult {
  name: string;
  reason: string;
  deadline: string;
  risk: "Critical" | "High" | "Medium" | "Low";
  penalty: string;
  explanation: string;
  law: string;
}

export interface ComplianceCheckPayload {
  turnover: number;
  employees: number;
}

// ---- Risk Monitor ----
export interface RiskFactor {
  id: string;
  label: string;
  score: number;
  trend: "up" | "down";
  change: number;
}

export interface RuleNode {
  id: string;
  condition: string;
  result: string;
  triggered: boolean;
}

export interface RiskData {
  factors: RiskFactor[];
  rules: RuleNode[];
}

// ---- Reports ----
export interface Report {
  id: string;
  name: string;
  period: string;
  generated: string;
  type: "PDF" | "Excel" | "CSV";
}

// ---- Integrations ----
export interface Integration {
  id: string;
  name: string;
  description: string;
  connected: boolean;
  lastSync: string;
  icon: string;
}

// ---- News Feed ----
export interface NewsArticle {
  id: number;
  title: string;
  source: string;
  url: string;
  publishedAt: string;
  category: string;
  impactLevel: "Low" | "Medium" | "High";
  summary: string;
  details: string;
}

// ---- AI Assistant ----
export interface ChatMessage {
  id: string;
  role: "user" | "ai";
  content: string;
  risks?: string[];
  actions?: string[];
  timestamp: string;
}

// ---- Notifications / Settings ----
export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  deadlineReminder: boolean;
  riskAlerts: boolean;
  newsUpdates: boolean;
  weeklyReport: boolean;
}

export interface UserSettings {
  profile: Omit<User, "id" | "company" | "role" | "createdAt">;
  company: Company;
  notifications: NotificationPreferences;
  twoFA: boolean;
  accentColor: string;
  theme: "light" | "dark";
}

// ---- Generic API Response ----
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}
