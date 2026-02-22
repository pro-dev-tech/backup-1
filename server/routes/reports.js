const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const store = require("../data/store");

router.get("/", authenticate, (req, res) => {
  const { type } = req.query;
  let data = store.reports;
  if (type && type !== "All") data = data.filter((r) => r.type === type);
  res.json({ success: true, data });
});

router.post("/generate", authenticate, (req, res) => {
  const types = ["PDF", "Excel", "CSV"];
  const report = {
    id: store.generateId(),
    name: "Custom Compliance Report",
    period: "February 2026",
    generated: new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" }),
    type: types[Math.floor(Math.random() * types.length)],
  };
  store.reports.unshift(report);
  res.status(201).json({ success: true, data: report, message: "Report generated successfully." });
});

router.delete("/:id", authenticate, (req, res) => {
  const idx = store.reports.findIndex((r) => r.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: "Report not found." });
  store.reports.splice(idx, 1);
  res.json({ success: true, data: null, message: "Report deleted." });
});

module.exports = router;
