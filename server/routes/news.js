// ============================================
// News Routes – Compliance news via Event Registry (newsapi.ai) + fallback
// ============================================

const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { EVENTREGISTRY_API_KEY } = require("../config/keys");
const { fallbackArticles } = require("../data/store");

async function fetchLiveNews(category) {
  if (!EVENTREGISTRY_API_KEY) return null;

  try {
    const today = new Date().toISOString().split("T")[0];
    const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Build keyword filters based on category
    const categoryKeywords = {
      GST: ["GST compliance", "CGST notification", "SGST amendment", "GST return filing", "e-invoice regulation"],
      MCA: ["MCA compliance", "company law amendment", "ROC filing", "corporate affairs notification"],
      SEBI: ["SEBI regulation", "securities compliance", "listing obligation", "SEBI circular"],
      Labour: ["labour compliance India", "EPF regulation", "ESIC notification", "minimum wages order"],
      Financial: ["RBI regulation", "banking compliance", "FEMA notification", "NBFC guidelines"],
      Tax: ["income tax compliance", "TDS regulation", "CBDT notification", "direct tax amendment"],
      Environmental: ["environmental compliance India", "pollution control regulation", "green compliance"],
    };

    const keywords = category && category !== "All" && categoryKeywords[category]
      ? categoryKeywords[category]
      : ["GST compliance", "MSME rules", "startup compliance", "India business regulations", "Indian regulatory compliance"];

    const keywordQuery = keywords.map((k) => ({ keyword: k }));

    const payload = {
      apiKey: EVENTREGISTRY_API_KEY,
      query: {
        $query: {
          $and: [
            { $or: keywordQuery },
            { locationUri: "http://en.wikipedia.org/wiki/India" },
          ],
        },
        dateStart: lastWeek,
        dateEnd: today,
      },
      resultType: "articles",
      articlesSortBy: "date",
      articlesCount: 15,
    };

    const resp = await fetch("https://eventregistry.org/api/v1/article/getArticles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) return null;

    const json = await resp.json();
    const results = json.articles?.results;
    if (!results || results.length === 0) return null;

    return results.map((item, idx) => ({
      id: idx + 1,
      title: item.title || "Untitled",
      source: item.source?.title || "Unknown",
      url: item.url || "#",
      publishedAt: item.dateTimePub || item.date || new Date().toISOString(),
      category: detectCategory(item.title + " " + (item.body || "")),
      impactLevel: detectImpact(item.title + " " + (item.body || "")),
      summary: (item.body || "").slice(0, 250),
      details: item.body || "",
    }));
  } catch (err) {
    console.error("Event Registry error:", err.message);
    return null;
  }
}

function detectCategory(text) {
  const t = text.toLowerCase();
  if (t.includes("gst") || t.includes("goods and services") || t.includes("e-invoice") || t.includes("e-way bill")) return "GST";
  if (t.includes("mca") || t.includes("corporate affairs") || t.includes("companies act") || t.includes("roc")) return "MCA";
  if (t.includes("sebi") || t.includes("securities") || t.includes("listing")) return "SEBI";
  if (t.includes("labour") || t.includes("epf") || t.includes("esic") || t.includes("employee") || t.includes("wages")) return "Labour";
  if (t.includes("rbi") || t.includes("reserve bank") || t.includes("banking") || t.includes("fema") || t.includes("nbfc")) return "Financial";
  if (t.includes("income tax") || t.includes("tds") || t.includes("cbdt") || t.includes("itr")) return "Tax";
  if (t.includes("environment") || t.includes("pollution") || t.includes("green")) return "Environmental";
  return "General";
}

function detectImpact(text) {
  const t = text.toLowerCase();
  if (t.includes("mandatory") || t.includes("penalty") || t.includes("deadline") || t.includes("critical") || t.includes("notification") || t.includes("order")) return "High";
  if (t.includes("update") || t.includes("amendment") || t.includes("revised") || t.includes("circular")) return "Medium";
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
