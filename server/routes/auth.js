// ============================================
// Auth Routes – Login, Register, Profile, Managed Users
// ============================================

const router = require("express").Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { JWT_SECRET } = require("../config/keys");
const { authenticate, authorize } = require("../middleware/auth");
const store = require("../data/store");

function signToken(user) {
  const payload = { id: user.id, email: user.email, role: user.role };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "24h" });
}

function sanitizeUser(u) {
  const { password, ...safe } = u;
  return safe;
}

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { email, password, role } = req.body;
  if (!email || !password) return res.status(400).json({ success: false, error: "Email and password are required." });

  const user = store.users.find((u) => u.email === email);
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ success: false, error: "Invalid credentials." });
  }

  const token = signToken({ ...user, role: role || user.role });
  res.json({
    success: true,
    data: { user: sanitizeUser({ ...user, role: role || user.role }), token, expiresAt: new Date(Date.now() + 86400000).toISOString() },
    message: "Login successful.",
  });
});

// POST /api/auth/register
router.post("/register", (req, res) => {
  const { firstName, lastName, email, password, phone, companyName } = req.body;
  if (!firstName || !email || !password) return res.status(400).json({ success: false, error: "All fields are required." });

  if (store.users.find((u) => u.email === email)) {
    return res.status(409).json({ success: false, error: "Email already exists." });
  }

  const newUser = {
    id: store.generateId(),
    firstName,
    lastName: lastName || "",
    email,
    phone: phone || "",
    password: bcrypt.hashSync(password, 10),
    company: { name: companyName || "", gstin: "", cin: "", state: "", employees: "0" },
    role: "admin",
    createdAt: new Date().toISOString(),
  };
  store.users.push(newUser);

  const token = signToken(newUser);
  res.status(201).json({
    success: true,
    data: { user: sanitizeUser(newUser), token, expiresAt: new Date(Date.now() + 86400000).toISOString() },
    message: "Registration successful.",
  });
});

// GET /api/auth/session
router.get("/session", authenticate, (req, res) => {
  const user = store.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ success: false, error: "User not found." });
  res.json({ success: true, data: { user: sanitizeUser(user), token: req.headers.authorization.split(" ")[1], expiresAt: new Date(Date.now() + 86400000).toISOString() } });
});

// PUT /api/auth/profile
router.put("/profile", authenticate, (req, res) => {
  const user = store.users.find((u) => u.id === req.user.id);
  if (!user) return res.status(404).json({ success: false, error: "User not found." });
  Object.assign(user, req.body, { id: user.id, password: user.password, role: user.role });
  res.json({ success: true, data: sanitizeUser(user), message: "Profile updated." });
});

// POST /api/auth/logout
router.post("/logout", (req, res) => {
  res.json({ success: true, data: null, message: "Logged out successfully." });
});

// ---- Managed Users ----
router.get("/managed-users", authenticate, authorize("admin"), (req, res) => {
  res.json({ success: true, data: store.managedUsers });
});

router.post("/managed-users", authenticate, authorize("admin"), (req, res) => {
  const { firstName, lastName, email, phone, role } = req.body;
  if (!firstName || !email || !role) return res.status(400).json({ success: false, error: "Missing required fields." });
  const newUser = { id: `usr-${Date.now()}`, firstName, lastName: lastName || "", email, phone: phone || "", role, createdAt: new Date().toISOString(), active: true };
  store.managedUsers.push(newUser);
  res.status(201).json({ success: true, data: newUser, message: "User added." });
});

router.delete("/managed-users/:id", authenticate, authorize("admin"), (req, res) => {
  const idx = store.managedUsers.findIndex((u) => u.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: "User not found." });
  store.managedUsers.splice(idx, 1);
  res.json({ success: true, data: null, message: "User removed." });
});

router.patch("/managed-users/:id/toggle", authenticate, authorize("admin"), (req, res) => {
  const user = store.managedUsers.find((u) => u.id === req.params.id);
  if (!user) return res.status(404).json({ success: false, error: "User not found." });
  user.active = !user.active;
  res.json({ success: true, data: user, message: `User ${user.active ? "activated" : "deactivated"}.` });
});

module.exports = router;
