const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const store = require("../data/store");

router.get("/", authenticate, (req, res) => {
  res.json({ success: true, data: store.settings });
});

router.put("/profile", authenticate, (req, res) => {
  Object.assign(store.settings.profile, req.body);
  res.json({ success: true, data: store.settings, message: "Profile updated." });
});

router.put("/company", authenticate, (req, res) => {
  Object.assign(store.settings.company, req.body);
  res.json({ success: true, data: store.settings, message: "Company details updated." });
});

router.put("/notifications", authenticate, (req, res) => {
  Object.assign(store.settings.notifications, req.body);
  res.json({ success: true, data: store.settings, message: "Notification preferences saved." });
});

router.put("/twofa", authenticate, (req, res) => {
  store.settings.twoFA = !!req.body.enabled;
  res.json({ success: true, data: store.settings, message: store.settings.twoFA ? "2FA enabled." : "2FA disabled." });
});

router.put("/appearance", authenticate, (req, res) => {
  if (req.body.accentColor) store.settings.accentColor = req.body.accentColor;
  if (req.body.theme) store.settings.theme = req.body.theme;
  res.json({ success: true, data: store.settings, message: "Appearance updated." });
});

router.post("/change-password", authenticate, (req, res) => {
  res.json({ success: true, data: null, message: "Password changed successfully." });
});

module.exports = router;
