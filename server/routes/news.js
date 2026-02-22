// ============================================
// News Routes – Live news via NewsData.io + fallback
// ============================================

const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { NEWSDATA_API_KEY } = require("../config/keys");
const { fallbackArticles } = require("../data/store");

async function fetchLiveNews(category) {
  if (!NEWSDATA_API_KEY) return null;

  try {
    const query = encodeURIComponent(
      category && category !== "All"
        ? `India ${category} compliance regulation`
        : "India GST MCA SEBI compliance regulation MSME"
    );
    const url = `https://newsdata.io/api/1/latest?apikey=${NEWSDATA_API_KEY}&q=${query}&country=in&language=en&category=business,politics`;
    const resp = await fetch(url);
    if (!resp.ok) return null;

    const json = await resp.json();
    if (!json.results || json.results.length === 0) return null;

    return json.results.slice(0, 10).map((item, idx) => ({
      id: idx + 1,
      title: item.title || "Untitled",
      source: item.source_name || "Unknown",
      url: item.link || "#",
      publishedAt: item.pubDate || new Date().toISOString(),
      category: detectCategory(item.title + " " + (item.description || "")),
      impactLevel: detectImpact(item.title + " " + (item.description || "")),
      summary: (item.description || "").slice(0, 200),
      details: item.content || item.description || "",
    }));
  } catch (err) {
    console.error("NewsData.io error:", err.message);
    return null;
  }
}

function detectCategory(text) {
  const t = text.toLowerCase();
  if (t.includes("gst") || t.includes("goods and services")) return "GST";
  if (t.includes("mca") || t.includes("corporate affairs")) return "MCA";
  if (t.includes("sebi") || t.includes("securities")) return "SEBI";
  if (t.includes("labour") || t.includes("epf") || t.includes("esic") || t.includes("employee")) return "Labour";
  if (t.includes("rbi") || t.includes("reserve bank") || t.includes("banking")) return "Financial";
  return "General";
}

function detectImpact(text) {
  const t = text.toLowerCase();
  if (t.includes("mandatory") || t.includes("penalty") || t.includes("deadline") || t.includes("critical")) return "High";
  if (t.includes("update") || t.includes("amendment") || t.includes("revised")) return "Medium";
  return "Low";
}

// GET /api/news
router.get("/", authenticate, async (req, res) => {
  const { category } = req.query;
  const live = await fetchLiveNews(category);
  if (live) return res.json({ success: true, data: live });

  let articles = fallbackArticles;
  if (category && category !== "All") articles = articles.filter((a) => a.category === category);
  res.json({ success: true, data: articles });
});

// GET /api/news/categories
router.get("/categories", authenticate, (req, res) => {
  const cats = [...new Set(fallbackArticles.map((a) => a.category))];
  res.json({ success: true, data: ["All", ...cats] });
});

// GET /api/news/:id
router.get("/:id", authenticate, (req, res) => {
  const article = fallbackArticles.find((a) => a.id === Number(req.params.id));
  res.json({ success: true, data: article || null });
});

module.exports = router;
