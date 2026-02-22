// ============================================
// In-Memory Data Store (replaces localStorage)
// ============================================

const { v4: uuidv4 } = require("uuid");
const bcrypt = require("bcryptjs");

// ---- Users ----
const users = [
  {
    id: "usr-001",
    firstName: "Admin",
    lastName: "Name",
    email: "rahul@acmepvt.com",
    phone: "+91 98765 43210",
    password: bcrypt.hashSync("admin123", 10),
    company: {
      name: "Acme Pvt Ltd",
      gstin: "27AABCU9603R1ZX",
      cin: "U72200MH2020PTC123456",
      state: "Maharashtra",
      employees: "35",
    },
    role: "admin",
    createdAt: "2025-06-15T10:00:00Z",
  },
];

// ---- Managed Users ----
const managedUsers = [];

// ---- Calendar Events ----
const calendarEvents = [
  { id: "ev-1", day: 7, month: 0, year: 2026, title: "TDS Payment", status: "completed", createdAt: "2026-01-01T00:00:00Z" },
  { id: "ev-2", day: 10, month: 0, year: 2026, title: "GST-1 Filing", status: "completed", createdAt: "2026-01-01T00:00:00Z" },
  { id: "ev-3", day: 15, month: 0, year: 2026, title: "PF Return", status: "completed", createdAt: "2026-01-01T00:00:00Z" },
  { id: "ev-4", day: 20, month: 0, year: 2026, title: "GST-3B Filing", status: "completed", createdAt: "2026-01-01T00:00:00Z" },
  { id: "ev-5", day: 25, month: 0, year: 2026, title: "ESI Return", status: "completed", createdAt: "2026-01-01T00:00:00Z" },
  { id: "ev-6", day: 7, month: 1, year: 2026, title: "TDS Payment", status: "completed", createdAt: "2026-01-01T00:00:00Z" },
  { id: "ev-7", day: 10, month: 1, year: 2026, title: "GST-1 Filing", status: "completed", createdAt: "2026-01-01T00:00:00Z" },
  { id: "ev-8", day: 15, month: 1, year: 2026, title: "PF Return", status: "overdue", createdAt: "2026-01-01T00:00:00Z" },
  { id: "ev-9", day: 20, month: 1, year: 2026, title: "GST-3B Filing", status: "upcoming", createdAt: "2026-01-01T00:00:00Z" },
  { id: "ev-10", day: 25, month: 1, year: 2026, title: "ESI Return", status: "upcoming", createdAt: "2026-01-01T00:00:00Z" },
  { id: "ev-11", day: 28, month: 1, year: 2026, title: "Professional Tax", status: "upcoming", createdAt: "2026-01-01T00:00:00Z" },
  { id: "ev-12", day: 7, month: 2, year: 2026, title: "TDS Payment", status: "upcoming", createdAt: "2026-01-01T00:00:00Z" },
  { id: "ev-13", day: 10, month: 2, year: 2026, title: "GST-1 Filing", status: "upcoming", createdAt: "2026-01-01T00:00:00Z" },
  { id: "ev-14", day: 15, month: 2, year: 2026, title: "PF Return", status: "upcoming", createdAt: "2026-01-01T00:00:00Z" },
  { id: "ev-15", day: 20, month: 2, year: 2026, title: "GST-3B Filing", status: "upcoming", createdAt: "2026-01-01T00:00:00Z" },
  { id: "ev-16", day: 25, month: 2, year: 2026, title: "ESI Return", status: "upcoming", createdAt: "2026-01-01T00:00:00Z" },
  { id: "ev-17", day: 31, month: 2, year: 2026, title: "TDS Return Q3", status: "upcoming", createdAt: "2026-01-01T00:00:00Z" },
  { id: "ev-18", day: 1, month: 3, year: 2026, title: "Annual Return Filing", status: "upcoming", createdAt: "2026-01-01T00:00:00Z" },
  { id: "ev-19", day: 7, month: 3, year: 2026, title: "TDS Payment", status: "upcoming", createdAt: "2026-01-01T00:00:00Z" },
  { id: "ev-20", day: 15, month: 3, year: 2026, title: "Advance Tax Q4", status: "upcoming", createdAt: "2026-01-01T00:00:00Z" },
  { id: "ev-21", day: 20, month: 3, year: 2026, title: "GST-3B Filing", status: "upcoming", createdAt: "2026-01-01T00:00:00Z" },
  { id: "ev-22", day: 30, month: 3, year: 2026, title: "GSTR-9 Annual", status: "upcoming", createdAt: "2026-01-01T00:00:00Z" },
];

// ---- Reports ----
const reports = [
  { id: "rpt-1", name: "Monthly Compliance Summary", period: "January 2026", generated: "Feb 5, 2026", type: "PDF" },
  { id: "rpt-2", name: "GST Filing Report", period: "Q3 FY2025-26", generated: "Jan 15, 2026", type: "Excel" },
  { id: "rpt-3", name: "Employee PF Compliance", period: "FY2025-26", generated: "Feb 1, 2026", type: "PDF" },
  { id: "rpt-4", name: "Risk Assessment Report", period: "February 2026", generated: "Feb 10, 2026", type: "PDF" },
  { id: "rpt-5", name: "Audit Trail Export", period: "Last 90 days", generated: "Feb 12, 2026", type: "CSV" },
];

// ---- Integrations ----
const integrations = [
  { id: "int-1", name: "Tally", description: "Accounting & bookkeeping", connected: true, lastSync: "2 hours ago", icon: "T" },
  { id: "int-2", name: "Zoho Books", description: "Invoice management", connected: true, lastSync: "30 min ago", icon: "Z" },
  { id: "int-3", name: "HRMS Portal", description: "Employee management", connected: true, lastSync: "1 hour ago", icon: "H" },
  { id: "int-4", name: "GSTN", description: "GST Network portal", connected: true, lastSync: "15 min ago", icon: "G" },
  { id: "int-5", name: "MCA21", description: "Ministry of Corporate Affairs", connected: false, lastSync: "—", icon: "M" },
  { id: "int-6", name: "EPFO", description: "Provident Fund portal", connected: true, lastSync: "4 hours ago", icon: "E" },
];

// ---- Risk Data ----
const riskData = {
  factors: [
    { id: "rf-1", label: "Regulatory Risk", score: 72, trend: "up", change: 5 },
    { id: "rf-2", label: "Filing Timeliness", score: 85, trend: "up", change: 5 },
    { id: "rf-3", label: "Penalty Exposure", score: 45, trend: "down", change: -8 },
    { id: "rf-4", label: "Data Accuracy", score: 91, trend: "up", change: 5 },
  ],
  rules: [
    { id: "rl-1", condition: "Revenue > ₹40L", result: "GST Registration Mandatory", triggered: true },
    { id: "rl-2", condition: "Employees > 20", result: "PF Applicable", triggered: true },
    { id: "rl-3", condition: "Employees > 10", result: "ESIC Applicable", triggered: true },
    { id: "rl-4", condition: "Revenue > ₹1Cr", result: "Tax Audit Required", triggered: false },
    { id: "rl-5", condition: "Inter-state sales", result: "E-way Bill Required", triggered: true },
  ],
};

// ---- Dashboard ----
const dashboardData = {
  stats: [
    { label: "Total Compliances", value: "59", icon: "FileText", change: "+3 this month" },
    { label: "Active Employees", value: "35", icon: "Users", change: "Karnataka" },
    { label: "Compliant", value: "42", icon: "ShieldCheck", change: "71% rate" },
    { label: "Pending Actions", value: "12", icon: "AlertTriangle", change: "5 urgent" },
  ],
  complianceScore: 82,
  riskTrend: [
    { month: "Sep", value: 65 }, { month: "Oct", value: 72 }, { month: "Nov", value: 68 },
    { month: "Dec", value: 75 }, { month: "Jan", value: 80 }, { month: "Feb", value: 82 },
  ],
  filingStatus: [
    { name: "Filed", value: 42 }, { name: "Pending", value: 12 }, { name: "Overdue", value: 5 },
  ],
  stateCompliance: [
    { state: "Maharashtra", score: 92 }, { state: "Karnataka", score: 85 },
    { state: "Tamil Nadu", score: 78 }, { state: "Delhi", score: 88 },
  ],
  monthlyActivity: [
    { month: "Sep", filings: 8, penalties: 1 }, { month: "Oct", filings: 12, penalties: 0 },
    { month: "Nov", filings: 10, penalties: 2 }, { month: "Dec", filings: 15, penalties: 1 },
    { month: "Jan", filings: 11, penalties: 0 }, { month: "Feb", filings: 9, penalties: 1 },
  ],
};

// ---- Settings ----
const settings = {
  profile: { firstName: "Rahul", lastName: "Agarwal", email: "rahul@acmepvt.com", phone: "+91 98765 43210" },
  company: { name: "Acme Pvt Ltd", gstin: "27AABCU9603R1ZX", cin: "U72200MH2020PTC123456", state: "Maharashtra", employees: "35" },
  notifications: { email: true, sms: false, deadlineReminder: true, riskAlerts: true, newsUpdates: false, weeklyReport: true },
  twoFA: false,
  accentColor: "220 90% 56%",
  theme: "dark",
};

// ---- Chat History ----
const chatHistory = [
  {
    id: "msg-init",
    role: "ai",
    content: "Hello! I'm your AI Compliance Assistant. I can help you understand regulations, draft responses, and identify applicable compliances for your MSME. How can I help you today?",
    timestamp: new Date().toISOString(),
  },
];

// ---- News Articles (fallback) ----
const fallbackArticles = [
  { id: 1, title: "CBIC notifies revised GST return filing timelines for MSMEs", source: "Ministry of Finance", url: "#", publishedAt: "2026-02-15T08:30:00Z", category: "GST", impactLevel: "High", summary: "New quarterly filing option available for businesses with turnover below ₹5 crore.", details: "Notification No. 12/2026 allows MSMEs with annual turnover below ₹5 crore to file GST returns quarterly starting April 2026." },
  { id: 2, title: "MCA mandates simplified annual return for small companies", source: "Ministry of Corporate Affairs", url: "#", publishedAt: "2026-02-14T14:00:00Z", category: "MCA", impactLevel: "Medium", summary: "Small companies can now file simplified one-page annual return (Form AOC-4S).", details: "Companies with paid-up capital up to ₹4 crore and turnover up to ₹40 crore can use the new simplified format." },
  { id: 3, title: "ESIC coverage extended to establishments with 10+ employees", source: "Ministry of Labour & Employment", url: "#", publishedAt: "2026-02-14T10:15:00Z", category: "Labour", impactLevel: "High", summary: "ESIC threshold reduced from 20 to 10 employees across all states.", details: "Effective April 1, 2026." },
  { id: 4, title: "SEBI circular on enhanced disclosure norms for listed MSMEs", source: "SEBI", url: "#", publishedAt: "2026-02-13T16:45:00Z", category: "SEBI", impactLevel: "Medium", summary: "Listed MSMEs must now disclose related party transactions quarterly.", details: "SEBI Circular SEBI/HO/CFD/CMD1/CIR/2026/15." },
  { id: 5, title: "New environmental compliance norms for manufacturing MSMEs", source: "Ministry of Environment", url: "#", publishedAt: "2026-02-13T09:00:00Z", category: "Environmental", impactLevel: "Medium", summary: "Small manufacturing units now require Consent to Operate renewal every 3 years.", details: "CPCB revised the consent renewal cycle for 'Green' and 'Orange' category industries." },
  { id: 6, title: "EPF interest rate revised to 8.25% for FY 2025-26", source: "EPFO", url: "#", publishedAt: "2026-02-12T12:30:00Z", category: "Labour", impactLevel: "Low", summary: "EPFO declares 8.25% interest on PF deposits.", details: "Central Board of Trustees of EPFO has approved 8.25% for FY 2025-26." },
  { id: 7, title: "RBI updates KYC requirements for NBFC-MFIs", source: "RBI", url: "#", publishedAt: "2026-02-12T08:00:00Z", category: "Financial", impactLevel: "High", summary: "Video KYC now mandatory for all loans above ₹50,000 issued by NBFC-MFIs.", details: "RBI Master Direction RBI/2026-27/12." },
  { id: 8, title: "GST Council recommends input tax credit simplification", source: "GST Council", url: "#", publishedAt: "2026-02-11T15:00:00Z", category: "GST", impactLevel: "High", summary: "Auto-populated ITC from GSTR-2B to become sole basis for credit claims.", details: "58th GST Council meeting recommendation, effective April 2026." },
];

module.exports = {
  users,
  managedUsers,
  calendarEvents,
  reports,
  integrations,
  riskData,
  dashboardData,
  settings,
  chatHistory,
  fallbackArticles,
  generateId: () => `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
};
