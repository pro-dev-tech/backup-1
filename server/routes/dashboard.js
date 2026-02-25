// ============================================
// Dashboard Routes – Dynamic compliance score from rule engine
// ============================================

const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const store = require("../data/store");
const { getComplianceScore } = require("../engine/ruleEngine");

router.get("/", authenticate, (req, res) => {
  const { score, hasData } = getComplianceScore(store);

  // Compute dynamic stats from violations
  const totalRulesChecked = Object.values(store.platformEvaluations).reduce(
    (sum, ev) => sum + (ev.violations ? ev.violations.length : 0), 0
  );

  const data = {
    ...store.dashboardData,
    complianceScore: hasData ? score : 0,
    hasEvaluations: hasData,
    totalViolations: store.violations.length,
    evaluatedPlatforms: Object.keys(store.platformEvaluations).length,
    recentViolations: store.violations.slice(-5),
    triggeredRules: store.violations.map((v) => ({
      condition: v.description,
      result: v.reason,
      severity: v.severity,
      ruleId: v.ruleId,
      legalReference: v.legalReference,
      platform: v.platform,
    })),
  };

  res.json({ success: true, data });
});

router.get("/score", authenticate, (req, res) => {
  const { score, hasData } = getComplianceScore(store);
  res.json({ success: true, data: { score, hasData } });
});

module.exports = router;
