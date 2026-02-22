const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const store = require("../data/store");

router.get("/", authenticate, (req, res) => {
  res.json({ success: true, data: store.integrations });
});

router.post("/:id/connect", authenticate, (req, res) => {
  const item = store.integrations.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ success: false, error: "Integration not found." });
  item.connected = true;
  item.lastSync = "Just now";
  res.json({ success: true, data: item, message: `${item.name} connected successfully.` });
});

router.post("/:id/disconnect", authenticate, (req, res) => {
  const item = store.integrations.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ success: false, error: "Integration not found." });
  item.connected = false;
  item.lastSync = "—";
  res.json({ success: true, data: item, message: `${item.name} disconnected.` });
});

router.post("/:id/sync", authenticate, (req, res) => {
  const item = store.integrations.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ success: false, error: "Integration not found." });
  item.lastSync = "Just now";
  res.json({ success: true, data: item, message: `${item.name} synced successfully.` });
});

module.exports = router;
