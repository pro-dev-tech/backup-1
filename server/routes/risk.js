const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { riskData } = require("../data/store");

router.get("/", authenticate, (req, res) => {
  res.json({ success: true, data: riskData });
});

router.get("/factors", authenticate, (req, res) => {
  res.json({ success: true, data: riskData.factors });
});

router.get("/rules", authenticate, (req, res) => {
  res.json({ success: true, data: riskData.rules });
});

module.exports = router;
