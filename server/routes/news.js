// ============================================
// News Routes – Compliance news via Event Registry (newsapi.ai)
// Strict live mode: no backend fallback articles
// ============================================

const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { EVENTREGISTRY_API_KEY } = require("../config/keys");

const REQUEST_TIMEOUT_MS = 15000;

const categoryKeywords = {
  GST: ["GST compliance", "CGST notification", "SGST amendment", "GST return filing", "e-invoice regulation"],
  MCA: ["MCA compliance", "company law amendment", "ROC filing", "corporate affairs notification"],
  SEBI: ["SEBI regulation", "securities compliance", "listing obligation", "SEBI circular"],
  Labour: ["labour compliance India", "EPF regulation", "ESIC notification", "minimum wages order"],
  Financial: ["RBI regulation", "banking compliance", "FEMA notification", "NBFC guidelines"],
  Tax: ["income tax compliance", "TDS regulation", "CBDT notification", "direct tax amendment"],
  Environmental: ["environmental compliance India", "pollution control regulation", "green compliance"],
};

function withTimeout(ms = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

async function fetchLiveNews(category) {
  if (!EVENTREGISTRY_API_KEY) {
    throw new Error("EVENTREGISTRY_API_KEY not configured");
  }

  const today = new Date().toISOString().split("T")[0];
  const lastWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  const keywords = category && category !== "All" && categoryKeywords[category]
    ? categoryKeywords[category]
    : ["GST compliance", "MSME rules", "startup compliance", "India business regulations"];

  const payload = {
    apiKey: EVENTREGISTRY_API_KEY,
    query: {
      $query: {
        $and: [
          { $or: keywords.map((keyword) => ({ keyword })) },
          { locationUri: "http://en.wikipedia.org/wiki/India" },
        ],
      },
      dateStart: lastWeek,
      dateEnd: today,
    },
    resultType: "articles",
    articlesSortBy: "date",
    articlesCount: 20,
  };

  const timeout = withTimeout();

  try {
    const response = await fetch("https://eventregistry.org/api/v1/article/getArticles", {
      method: "POST",
      signal: timeout.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`Event Registry API error (${response.status}): ${errorBody.slice(0, 500)}`);
    }

    const json = await response.json();
    const results = json?.articles?.results || [];

    return results.map((item, idx) => ({
      id: idx + 1,
      title: item.title || "Untitled",
      source: item.source?.title || "Unknown",
      url: item.url || "#",
      publishedAt: item.dateTimePub || item.date || new Date().toISOString(),
      category: detectCategory(`${item.title || ""} ${item.body || ""}`),
      impactLevel: detectImpact(`${item.title || ""} ${item.body || ""}`),
      summary: (item.body || "").slice(0, 250),
      details: item.body || "",
    }));
  } catch (err) {
    if (err?.name === "AbortError") {
      throw new Error(`Event Registry request timed out after ${REQUEST_TIMEOUT_MS}ms`);
    }
    throw err;
  } finally {
    timeout.clear();
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

  try {
    const live = await fetchLiveNews(category);
    return res.json({ success: true, data: live });
  } catch (err) {
    console.error("News service unavailable:", err?.message || err);
    return res.status(503).json({
      success: false,
      error: "News service currently not available.",
      details: err?.message || "Unable to fetch from Event Registry",
    });
  }
});

// GET /api/news/categories
router.get("/categories", authenticate, (req, res) => {
  res.json({ success: true, data: ["All", ...Object.keys(categoryKeywords), "General"] });
});

// GET /api/news/:id
router.get("/:id", authenticate, async (req, res) => {
  try {
    const list = await fetchLiveNews("All");
    const article = list.find((a) => a.id === Number(req.params.id)) || null;
    if (!article) return res.status(404).json({ success: false, error: "Article not found." });
    return res.json({ success: true, data: article });
  } catch (err) {
    console.error("News by id failed:", err?.message || err);
    return res.status(503).json({
      success: false,
      error: "News service currently not available.",
      details: err?.message || "Unable to fetch article",
    });
  }
});

module.exports = router;
