// ============================================
// Rule Engine – Deterministic compliance evaluation
// AI does NOT decide compliance status
// ============================================

const rules = require("./rules");

/**
 * Run the rule engine against structured data for a given platform.
 * Returns violations, risk score, and risk level.
 */
function runRuleEngine(platformType, structuredData, store) {
  const platformRules = rules[platformType];
  if (!platformRules) {
    return { violations: [], riskScore: 0, riskLevel: "Low", rulesChecked: 0 };
  }

  const violations = [];
  let riskPoints = 0;

  for (const rule of platformRules) {
    try {
      const result = rule.evaluate(structuredData);
      if (result.triggered) {
        const violation = {
          id: store.generateId(),
          ruleId: rule.ruleId,
          platform: platformType,
          description: rule.description,
          reason: result.reason,
          severity: rule.severity,
          penaltyImpact: rule.penaltyImpact,
          legalReference: rule.legalReference,
          version: rule.version,
          timestamp: new Date().toISOString(),
        };
        violations.push(violation);
        store.violations.push(violation);

        // Risk scoring: Low=5, Medium=10, High=20
        riskPoints += rule.severity === "High" ? 20 : rule.severity === "Medium" ? 10 : 5;

        // Audit trail logging
        store.auditTrail.push({
          id: store.generateId(),
          type: "rule_trigger",
          ruleId: rule.ruleId,
          platform: platformType,
          description: rule.description,
          severity: rule.severity,
          reason: result.reason,
          legalReference: rule.legalReference,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error(`Rule ${rule.ruleId} evaluation error:`, err.message);
    }
  }

  const riskLevel = riskPoints <= 20 ? "Low" : riskPoints <= 50 ? "Medium" : "High";

  // Persist platform evaluation
  store.platformEvaluations[platformType] = {
    data: structuredData,
    violations,
    riskScore: riskPoints,
    riskLevel,
    lastEvaluated: new Date().toISOString(),
  };

  return { violations, riskScore: riskPoints, riskLevel, rulesChecked: platformRules.length };
}

/**
 * Calculate dynamic compliance score from all violations.
 * Score = max(0, 100 - totalRiskPoints)
 */
function getComplianceScore(store) {
  if (Object.keys(store.platformEvaluations).length === 0) {
    return { score: 0, hasData: false };
  }

  const totalPoints = store.violations.reduce((sum, v) => {
    return sum + (v.severity === "High" ? 20 : v.severity === "Medium" ? 10 : 5);
  }, 0);

  return { score: Math.max(0, 100 - totalPoints), hasData: true };
}

/**
 * Generate calendar deadline suggestions based on platform type.
 */
function generateCalendarSuggestions(platformType) {
  const now = new Date();
  const suggestions = [];

  const deadlines = {
    gstn: [
      { title: "GSTR-1 Filing", dayOfMonth: 11, frequency: "monthly" },
      { title: "GSTR-3B Filing", dayOfMonth: 20, frequency: "monthly" },
    ],
    epfo: [
      { title: "PF Deposit", dayOfMonth: 15, frequency: "monthly" },
    ],
    mca21: [
      { title: "MCA Annual Return (MGT-7)", month: 10, day: 30, frequency: "annual" },
      { title: "MCA Financial Statements (AOC-4)", month: 9, day: 30, frequency: "annual" },
    ],
    incometax: [
      { title: "TDS Return - Quarterly", month: (Math.floor(now.getMonth() / 3) * 3 + 3) % 12, day: 31, frequency: "quarterly" },
      { title: "Advance Tax Installment", month: (Math.floor(now.getMonth() / 3) * 3 + 2) % 12, day: 15, frequency: "quarterly" },
    ],
  };

  const platformDeadlines = deadlines[platformType] || [];

  for (const d of platformDeadlines) {
    if (d.frequency === "monthly") {
      for (let i = 0; i < 3; i++) {
        const month = (now.getMonth() + i) % 12;
        const year = now.getFullYear() + Math.floor((now.getMonth() + i) / 12);
        suggestions.push({ title: d.title, day: d.dayOfMonth, month, year, status: "upcoming" });
      }
    } else {
      suggestions.push({
        title: d.title,
        day: d.day,
        month: d.month,
        year: now.getFullYear(),
        status: "upcoming",
      });
    }
  }

  return suggestions;
}

module.exports = { runRuleEngine, getComplianceScore, generateCalendarSuggestions };
