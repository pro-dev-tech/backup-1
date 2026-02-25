// ============================================
// Compliance Rules – Deterministic rule definitions per platform
// AI must NOT decide compliance status – rules are authoritative
// ============================================

const rules = {
  gstn: [
    {
      ruleId: "GSTN-001", description: "Tax collected vs tax reported mismatch",
      severity: "High", penaltyImpact: "₹10,000 or 10% of tax due (whichever is higher)",
      legalReference: "CGST Act, 2017 - Section 73/74", version: "1.0",
      evaluate: (d) => d.tax_collected != null && d.tax_reported != null && Math.abs(d.tax_collected - d.tax_reported) > 0
        ? { triggered: true, reason: `Tax collected (₹${d.tax_collected}) ≠ Tax reported (₹${d.tax_reported}). Difference: ₹${Math.abs(d.tax_collected - d.tax_reported)}` }
        : { triggered: false },
    },
    {
      ruleId: "GSTN-002", description: "Late GST filing detected",
      severity: "High", penaltyImpact: "₹50/day (CGST) + ₹50/day (SGST), max ₹10,000",
      legalReference: "CGST Act, 2017 - Section 47", version: "1.0",
      evaluate: (d) => d.filing_date && d.due_date && new Date(d.filing_date) > new Date(d.due_date)
        ? { triggered: true, reason: `Filing date (${d.filing_date}) exceeds due date (${d.due_date})` }
        : { triggered: false },
    },
    {
      ruleId: "GSTN-003", description: "Input Tax Credit exceeds allowed threshold",
      severity: "Medium", penaltyImpact: "Reversal of excess ITC + interest at 18% p.a.",
      legalReference: "CGST Rules, 2017 - Rule 36(4)", version: "1.0",
      evaluate: (d) => d.input_tax_credit != null && d.allowed_itc_threshold != null && d.input_tax_credit > d.allowed_itc_threshold
        ? { triggered: true, reason: `ITC claimed (₹${d.input_tax_credit}) exceeds threshold (₹${d.allowed_itc_threshold})` }
        : { triggered: false },
    },
  ],
  mca21: [
    {
      ruleId: "MCA-001", description: "Annual return not filed within statutory timeline",
      severity: "High", penaltyImpact: "₹100/day up to ₹5,00,000",
      legalReference: "Companies Act, 2013 - Section 92(5)", version: "1.0",
      evaluate: (d) => d.annual_return_filed === false || (d.filing_date && d.statutory_deadline && new Date(d.filing_date) > new Date(d.statutory_deadline))
        ? { triggered: true, reason: "Annual return not filed or filed after statutory deadline" }
        : { triggered: false },
    },
    {
      ruleId: "MCA-002", description: "Director KYC expired",
      severity: "Medium", penaltyImpact: "₹5,000 per director + DIN deactivation",
      legalReference: "Companies (Appointment and Qualification of Directors) Rules, 2014 - Rule 12A", version: "1.0",
      evaluate: (d) => d.director_kyc_expiry && new Date(d.director_kyc_expiry) < new Date()
        ? { triggered: true, reason: `Director KYC expired on ${d.director_kyc_expiry}` }
        : { triggered: false },
    },
    {
      ruleId: "MCA-003", description: "Incorporation filing missing",
      severity: "High", penaltyImpact: "Strike-off proceedings under Section 248",
      legalReference: "Companies Act, 2013 - Section 248", version: "1.0",
      evaluate: (d) => d.incorporation_filing_missing === true
        ? { triggered: true, reason: "Critical incorporation filing documents are missing" }
        : { triggered: false },
    },
  ],
  epfo: [
    {
      ruleId: "EPFO-001", description: "Employee PF deduction below mandatory 12%",
      severity: "High", penaltyImpact: "Damages up to 100% of arrears + prosecution",
      legalReference: "EPF & MP Act, 1952 - Section 14B", version: "1.0",
      evaluate: (d) => d.pf_deduction_percent != null && d.pf_deduction_percent < 12
        ? { triggered: true, reason: `PF deduction at ${d.pf_deduction_percent}% is below mandatory 12%` }
        : { triggered: false },
    },
    {
      ruleId: "EPFO-002", description: "Employer contribution mismatch",
      severity: "High", penaltyImpact: "Interest at 12% p.a. on delayed/short payments",
      legalReference: "EPF & MP Act, 1952 - Section 7Q", version: "1.0",
      evaluate: (d) => d.employer_contribution != null && d.expected_contribution != null && Math.abs(d.employer_contribution - d.expected_contribution) > 0
        ? { triggered: true, reason: `Employer contribution (₹${d.employer_contribution}) ≠ Expected (₹${d.expected_contribution})` }
        : { triggered: false },
    },
    {
      ruleId: "EPFO-003", description: "Late PF deposit",
      severity: "Medium", penaltyImpact: "Damages under Section 14B + interest under 7Q",
      legalReference: "EPF & MP Act, 1952 - Section 14B", version: "1.0",
      evaluate: (d) => d.deposit_date && d.due_date && new Date(d.deposit_date) > new Date(d.due_date)
        ? { triggered: true, reason: `PF deposited on ${d.deposit_date}, due was ${d.due_date}` }
        : { triggered: false },
    },
  ],
  tally: [
    {
      ruleId: "TALLY-001", description: "GST ledger mapping validation failed",
      severity: "Medium", penaltyImpact: "Incorrect ITC claims, potential reversal + interest",
      legalReference: "CGST Act, 2017 - Section 16", version: "1.0",
      evaluate: (d) => d.gst_ledger_mapped === false
        ? { triggered: true, reason: "GST ledger is not properly mapped to tax categories" }
        : { triggered: false },
    },
    {
      ruleId: "TALLY-002", description: "Unclassified transactions detected",
      severity: "Medium", penaltyImpact: "Tax categorization errors in returns",
      legalReference: "Income Tax Act - Section 145", version: "1.0",
      evaluate: (d) => d.unclassified_transactions != null && d.unclassified_transactions > 0
        ? { triggered: true, reason: `${d.unclassified_transactions} unclassified transactions found` }
        : { triggered: false },
    },
    {
      ruleId: "TALLY-003", description: "Missing tax category on transactions",
      severity: "Low", penaltyImpact: "Classification errors in GST/IT returns",
      legalReference: "CGST Act, 2017 - Section 35", version: "1.0",
      evaluate: (d) => d.missing_tax_category != null && d.missing_tax_category > 0
        ? { triggered: true, reason: `${d.missing_tax_category} transactions missing tax category` }
        : { triggered: false },
    },
  ],
  zoho: [
    {
      ruleId: "ZOHO-001", description: "Tax collected vs invoice total mismatch",
      severity: "High", penaltyImpact: "Under-reporting of tax liability",
      legalReference: "CGST Act, 2017 - Section 73", version: "1.0",
      evaluate: (d) => d.tax_collected != null && d.invoice_tax_total != null && Math.abs(d.tax_collected - d.invoice_tax_total) > 0
        ? { triggered: true, reason: `Tax collected (₹${d.tax_collected}) ≠ Invoice tax total (₹${d.invoice_tax_total})` }
        : { triggered: false },
    },
    {
      ruleId: "ZOHO-002", description: "Duplicate invoice numbers detected",
      severity: "Medium", penaltyImpact: "Invoice rejection by GSTN portal",
      legalReference: "CGST Rules, 2017 - Rule 46", version: "1.0",
      evaluate: (d) => d.duplicate_invoices != null && d.duplicate_invoices > 0
        ? { triggered: true, reason: `${d.duplicate_invoices} duplicate invoice numbers found` }
        : { triggered: false },
    },
    {
      ruleId: "ZOHO-003", description: "Invalid GST rate mapping on items",
      severity: "Medium", penaltyImpact: "Incorrect tax calculation on invoices",
      legalReference: "CGST Act, 2017 - Schedule I-IV", version: "1.0",
      evaluate: (d) => d.invalid_gst_rates != null && d.invalid_gst_rates > 0
        ? { triggered: true, reason: `${d.invalid_gst_rates} items with invalid GST rate mapping` }
        : { triggered: false },
    },
  ],
  rbi: [
    {
      ruleId: "RBI-001", description: "Mandatory circular not acknowledged",
      severity: "High", penaltyImpact: "Regulatory non-compliance penalty under RBI Act",
      legalReference: "RBI Act, 1934 - Section 45", version: "1.0",
      evaluate: (d) => d.circular_type === "mandatory" && d.acknowledged === false
        ? { triggered: true, reason: "Mandatory RBI circular has not been acknowledged" }
        : { triggered: false },
    },
    {
      ruleId: "RBI-002", description: "Deadline-based circular approaching expiry",
      severity: "Medium", penaltyImpact: "Non-compliance after deadline",
      legalReference: "RBI Master Directions", version: "1.0",
      evaluate: (d) => d.circular_type === "deadline" && d.deadline && new Date(d.deadline) < new Date(Date.now() + 7 * 86400000)
        ? { triggered: true, reason: `Circular deadline ${d.deadline} is within 7 days` }
        : { triggered: false },
    },
  ],
  sebi: [
    {
      ruleId: "SEBI-001", description: "High impact regulatory update not actioned",
      severity: "High", penaltyImpact: "SEBI penalty up to ₹25 crore or 3x profit",
      legalReference: "SEBI Act, 1992 - Section 15", version: "1.0",
      evaluate: (d) => d.impact_level === "High" && d.actioned === false
        ? { triggered: true, reason: "High-impact SEBI update has not been actioned" }
        : { triggered: false },
    },
    {
      ruleId: "SEBI-002", description: "Compliance deadline has passed without action",
      severity: "Medium", penaltyImpact: "Late submission penalty + show-cause notice",
      legalReference: "SEBI LODR Regulations, 2015", version: "1.0",
      evaluate: (d) => d.deadline_relevant === true && d.deadline && new Date(d.deadline) < new Date()
        ? { triggered: true, reason: `SEBI compliance deadline ${d.deadline} has passed` }
        : { triggered: false },
    },
  ],
  incometax: [
    {
      ruleId: "IT-001", description: "TDS claimed does not match Form 26AS",
      severity: "High", penaltyImpact: "Disallowance of TDS credit + demand notice",
      legalReference: "Income Tax Act - Section 199/203AA", version: "1.0",
      evaluate: (d) => d.tds_claimed != null && d.tds_26as != null && Math.abs(d.tds_claimed - d.tds_26as) > 0
        ? { triggered: true, reason: `TDS claimed (₹${d.tds_claimed}) ≠ 26AS (₹${d.tds_26as}). Difference: ₹${Math.abs(d.tds_claimed - d.tds_26as)}` }
        : { triggered: false },
    },
    {
      ruleId: "IT-002", description: "Income tax return filed after deadline",
      severity: "High", penaltyImpact: "₹5,000 u/s 234F + interest u/s 234A/B/C",
      legalReference: "Income Tax Act - Section 139(1), 234F", version: "1.0",
      evaluate: (d) => d.return_filing_date && d.deadline && new Date(d.return_filing_date) > new Date(d.deadline)
        ? { triggered: true, reason: `Return filed on ${d.return_filing_date}, deadline was ${d.deadline}` }
        : { triggered: false },
    },
    {
      ruleId: "IT-003", description: "Advance tax shortfall detected",
      severity: "Medium", penaltyImpact: "Interest u/s 234B at 1% per month on shortfall",
      legalReference: "Income Tax Act - Section 234B", version: "1.0",
      evaluate: (d) => d.advance_tax_paid != null && d.advance_tax_due != null && d.advance_tax_paid < d.advance_tax_due * 0.9
        ? { triggered: true, reason: `Advance tax paid (₹${d.advance_tax_paid}) < 90% of tax due (₹${d.advance_tax_due})` }
        : { triggered: false },
    },
  ],
};

module.exports = rules;
