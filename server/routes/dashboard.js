const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { dashboardData } = require("../data/store");

router.get("/", authenticate, (req, res) => {
  res.json({ success: true, data: dashboardData });
});

router.get("/score", authenticate, (req, res) => {
  res.json({ success: true, data: dashboardData.complianceScore });
});

module.exports = router;
