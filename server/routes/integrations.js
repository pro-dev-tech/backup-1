// ============================================
// Integrations Routes – Platform management, file upload, rule evaluation
// Replaces mock connect/disconnect with real rule engine evaluation
// ============================================

const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const store = require("../data/store");
const { runRuleEngine, getComplianceScore, generateCalendarSuggestions } = require("../engine/ruleEngine");

const platforms = [
  { id: "gstn", name: "GSTN", description: "GST Network Portal – Tax filing & returns", apiStatus: "restricted", icon: "G", category: "Tax", acceptedFormats: ["JSON", "CSV"],
    sampleFields: ["tax_collected", "tax_reported", "filing_date", "due_date", "input_tax_credit", "allowed_itc_threshold"] },
  { id: "mca21", name: "MCA21", description: "Ministry of Corporate Affairs – Company filings", apiStatus: "unavailable", icon: "M", category: "Corporate", acceptedFormats: ["JSON"],
    sampleFields: ["annual_return_filed", "filing_date", "statutory_deadline", "director_kyc_expiry", "incorporation_filing_missing"] },
  { id: "epfo", name: "EPFO", description: "Provident Fund Portal – ECR & payroll", apiStatus: "unavailable", icon: "E", category: "Labour", acceptedFormats: ["CSV", "JSON"],
    sampleFields: ["pf_deduction_percent", "employer_contribution", "expected_contribution", "deposit_date", "due_date"] },
  { id: "tally", name: "TallyPrime", description: "Accounting & Bookkeeping – Ledger data", apiStatus: "local", icon: "T", category: "Accounting", acceptedFormats: ["XML", "CSV", "JSON"],
    sampleFields: ["gst_ledger_mapped", "unclassified_transactions", "missing_tax_category"] },
  { id: "zoho", name: "Zoho Books", description: "Invoice Management – Tax & billing", apiStatus: "available", icon: "Z", category: "Accounting", acceptedFormats: ["CSV", "JSON"],
    sampleFields: ["tax_collected", "invoice_tax_total", "duplicate_invoices", "invalid_gst_rates"] },
  { id: "rbi", name: "RBI Circulars", description: "Reserve Bank of India – Regulatory circulars", apiStatus: "unavailable", icon: "R", category: "Financial", acceptedFormats: ["JSON"],
    sampleFields: ["circular_type", "acknowledged", "deadline"] },
  { id: "sebi", name: "SEBI Updates", description: "Securities & Exchange Board – Compliance updates", apiStatus: "unavailable", icon: "S", category: "Securities", acceptedFormats: ["JSON"],
    sampleFields: ["impact_level", "actioned", "deadline_relevant", "deadline"] },
  { id: "incometax", name: "Income Tax Portal", description: "Income Tax Department – ITR, TDS, 26AS", apiStatus: "restricted", icon: "I", category: "Tax", acceptedFormats: ["JSON", "CSV"],
    sampleFields: ["tds_claimed", "tds_26as", "return_filing_date", "deadline", "advance_tax_paid", "advance_tax_due"] },
];

// GET /api/integrations – list platforms with evaluation status
router.get("/", authenticate, (req, res) => {
  const enriched = platforms.map((p) => ({
    ...p,
    evaluation: store.platformEvaluations[p.id] || null,
    violationCount: store.platformEvaluations[p.id]?.violations?.length || 0,
  }));
  res.json({ success: true, data: enriched });
});

// POST /api/integrations/:platform/evaluate – run rule engine on uploaded data
router.post("/:platform/evaluate", authenticate, (req, res) => {
  const { platform } = req.params;
  const { data } = req.body;

  if (!data || typeof data !== "object") {
    return res.status(400).json({ success: false, error: "Structured data object is required." });
  }

  const platformInfo = platforms.find((p) => p.id === platform);
  if (!platformInfo) {
    return res.status(404).json({ success: false, error: "Platform not found." });
  }

  // Clear previous violations for this platform
  store.violations = store.violations.filter((v) => v.platform !== platform);

  const result = runRuleEngine(platform, data, store);
  const calendarSuggestions = generateCalendarSuggestions(platform);

  // Log evaluation event
  store.auditTrail.push({
    id: store.generateId(),
    type: "evaluation",
    platform,
    platformName: platformInfo.name,
    rulesChecked: result.rulesChecked,
    violationsFound: result.violations.length,
    riskScore: result.riskScore,
    riskLevel: result.riskLevel,
    timestamp: new Date().toISOString(),
  });

  res.json({
    success: true,
    data: {
      ...result,
      platform: platformInfo.name,
      platformId: platform,
      calendarSuggestions,
    },
    message: `Evaluated ${result.rulesChecked} rules for ${platformInfo.name}. Found ${result.violations.length} violation(s).`,
  });
});

// GET /api/integrations/violations – all violations across platforms
router.get("/violations", authenticate, (req, res) => {
  res.json({ success: true, data: store.violations });
});

// GET /api/integrations/score – dynamic compliance score
router.get("/score", authenticate, (req, res) => {
  const { score, hasData } = getComplianceScore(store);
  res.json({
    success: true,
    data: { score, hasData, totalViolations: store.violations.length, platforms: Object.keys(store.platformEvaluations).length },
  });
});

// GET /api/integrations/audit-trail – audit trail
router.get("/audit-trail", authenticate, (req, res) => {
  res.json({ success: true, data: store.auditTrail.slice(-100).reverse() });
});

// POST /api/integrations/calendar-add – add suggested events to calendar
router.post("/calendar-add", authenticate, (req, res) => {
  const { events } = req.body;
  if (!Array.isArray(events)) {
    return res.status(400).json({ success: false, error: "Events array is required." });
  }

  let added = 0;
  for (const ev of events) {
    const exists = store.calendarEvents.some(
      (e) => e.title === ev.title && e.day === ev.day && e.month === ev.month && e.year === ev.year
    );
    if (!exists) {
      store.calendarEvents.push({
        id: `ev-${store.generateId()}`,
        ...ev,
        createdAt: new Date().toISOString(),
      });
      added++;
    }
  }

  res.json({ success: true, data: { added }, message: `${added} event(s) added to calendar.` });
});

module.exports = router;
