const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const store = require("../data/store");

router.get("/", authenticate, (req, res) => {
  const { month, year } = req.query;
  let events = store.calendarEvents;
  if (month !== undefined && year !== undefined) {
    events = events.filter((e) => e.month === Number(month) && e.year === Number(year));
  }
  res.json({ success: true, data: events });
});

router.post("/", authenticate, (req, res) => {
  const { day, month, year, title, status } = req.body;
  if (!title) return res.status(400).json({ success: false, error: "Title is required." });
  const event = { id: store.generateId(), day, month, year, title, status: status || "upcoming", createdAt: new Date().toISOString() };
  store.calendarEvents.push(event);
  res.status(201).json({ success: true, data: event, message: "Event added." });
});

router.patch("/:id/status", authenticate, (req, res) => {
  const event = store.calendarEvents.find((e) => e.id === req.params.id);
  if (!event) return res.status(404).json({ success: false, error: "Event not found." });
  event.status = req.body.status;
  res.json({ success: true, data: event, message: "Status updated." });
});

router.delete("/:id", authenticate, (req, res) => {
  const idx = store.calendarEvents.findIndex((e) => e.id === req.params.id);
  if (idx === -1) return res.status(404).json({ success: false, error: "Event not found." });
  store.calendarEvents.splice(idx, 1);
  res.json({ success: true, data: null, message: "Event deleted." });
});

module.exports = router;
