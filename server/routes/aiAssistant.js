// ============================================
// AI Assistant Routes – Cascading fallback: Gemini → Groq → OpenRouter
// Context-aware: pulls live data from calendar, dashboard, risk, settings
// ============================================

const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { GEMINI_API_KEY, OPENROUTER_API_KEY, GROQ_API_KEY } = require("../config/keys");
const store = require("../data/store");

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const REQUEST_TIMEOUT_MS = 20000;
const MODEL_CONFIG = {
  maxTokens: 1000,
  temperature: 0.7,
};

function withTimeout(ms = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return {
    signal: controller.signal,
    clear: () => clearTimeout(timer),
  };
}

function normalizeProviderError(prefix, err) {
  if (err?.name === "AbortError") {
    return `${prefix} request timed out after ${REQUEST_TIMEOUT_MS}ms`;
  }
  return `${prefix} ${err?.message || "Unknown provider error"}`;
}

function extractOpenAIText(json) {
  const choice = json?.choices?.[0];
  if (!choice) return "";

  if (typeof choice.message?.content === "string") {
    return choice.message.content;
  }

  if (Array.isArray(choice.message?.content)) {
    return choice.message.content
      .map((part) => (typeof part?.text === "string" ? part.text : ""))
      .join("")
      .trim();
  }

  return "";
}

function extractGeminiText(json) {
  const parts = json?.candidates?.[0]?.content?.parts || [];
  const text = parts
    .map((part) => (typeof part?.text === "string" ? part.text : ""))
    .join("")
    .trim();
  return text;
}

function toOpenAIMessages(messages) {
  return [
    { role: "system", content: getSystemPrompt() },
    ...messages.map((m) => ({
      role: m.role === "ai" ? "assistant" : "user",
      content: m.content,
    })),
  ];
}

function toGeminiContents(messages) {
  const mapped = messages.map((m) => ({
    role: m.role === "ai" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  if (mapped.length > 0) return mapped;

  return [{ role: "user", parts: [{ text: "Please assist with my compliance query." }] }];
}

// Build dynamic context from all features
function buildUserContext() {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const currentDay = now.getDate();

  // ---- Calendar / Deadlines ----
  const upcomingEvents = store.calendarEvents
    .filter((e) => {
      if (e.status === "completed") return false;
      const eventDate = new Date(e.year, e.month, e.day);
      return eventDate >= now;
    })
    .sort((a, b) => new Date(a.year, a.month, a.day) - new Date(b.year, b.month, b.day))
    .slice(0, 10);

  const overdueEvents = store.calendarEvents.filter((e) => e.status === "overdue");

  const calendarContext = upcomingEvents.length > 0
    ? upcomingEvents.map((e) => `- ${e.title}: ${MONTHS[e.month]} ${e.day}, ${e.year} (${e.status})`).join("\n")
    : "No upcoming events.";

  const overdueContext = overdueEvents.length > 0
    ? overdueEvents.map((e) => `- ${e.title}: ${MONTHS[e.month]} ${e.day}, ${e.year}`).join("\n")
    : "None.";

  // ---- Dashboard Stats ----
  const stats = store.dashboardData.stats;
  const dashboardContext = stats.map((s) => `- ${s.label}: ${s.value} (${s.change})`).join("\n");

  // ---- Compliance Score ----
  const complianceScore = store.dashboardData.complianceScore;
  const filingStatus = store.dashboardData.filingStatus.map((f) => `${f.name}: ${f.value}`).join(", ");

  // ---- Risk Data ----
  const riskContext = store.riskData.factors
    .map((r) => `- ${r.label}: Score ${r.score}/100 (Trend: ${r.trend}, Change: ${r.change > 0 ? "+" : ""}${r.change})`)
    .join("\n");

  const riskRules = store.riskData.rules
    .filter((r) => r.triggered)
    .map((r) => `- ${r.condition} → ${r.result}`)
    .join("\n");

  // ---- Company Profile ----
  const company = store.settings.company;
  const profile = store.settings.profile;

  // ---- Integrations ----
  const connectedIntegrations = store.integrations
    .filter((i) => i.connected)
    .map((i) => `${i.name} (${i.description}) – last synced ${i.lastSync}`)
    .join(", ");

  // ---- State Compliance ----
  const stateCompliance = store.dashboardData.stateCompliance
    .map((s) => `${s.state}: ${s.score}/100`)
    .join(", ");

  return `
=== LIVE BUSINESS CONTEXT (Today: ${MONTHS[currentMonth]} ${currentDay}, ${currentYear}) ===

COMPANY PROFILE:
- Name: ${company.name}
- GSTIN: ${company.gstin}
- CIN: ${company.cin}
- State: ${company.state}
- Employees: ${company.employees}
- Contact: ${profile.firstName} ${profile.lastName} (${profile.email}, ${profile.phone})

COMPLIANCE DASHBOARD:
${dashboardContext}
- Overall Compliance Score: ${complianceScore}/100
- Filing Status: ${filingStatus}
- State-wise Compliance: ${stateCompliance}

UPCOMING DEADLINES (Next 10):
${calendarContext}

OVERDUE ITEMS:
${overdueContext}

RISK ASSESSMENT:
${riskContext}

TRIGGERED COMPLIANCE RULES:
${riskRules}

CONNECTED INTEGRATIONS:
${connectedIntegrations}

=== END CONTEXT ===`;
}

const BASE_SYSTEM_PROMPT = `You are a professional Compliance Assistant specializing in Indian regulatory and business compliance. You have access to the user's live business data including their company profile, compliance calendar, risk scores, filing status, and deadlines.

Core Expertise:
- Taxation: GST (filing, ITC, returns), Income Tax (TDS, advance tax, ITR), Professional Tax
- Corporate Law: MCA filings (AOC-4, MGT-7, DIR forms), ROC compliance, annual returns
- Securities: SEBI regulations, listing obligations, insider trading rules
- Labour & Employment: EPF, ESIC, Payment of Wages, Shops & Establishment Act, Labour Codes
- Banking & Finance: RBI guidelines, FEMA compliance, NBFC regulations
- Industry-Specific: MSME registration, Startup India, DPIIT compliance

Response Guidelines:
1. Always be professional, precise, and solution-oriented
2. When users ask about deadlines, dates, or status — refer to the LIVE BUSINESS CONTEXT provided below
3. Structure responses with clear headings, bullet points, and numbered steps
4. Cite relevant Indian laws, sections, rules, or notifications where applicable
5. Highlight deadlines, penalties, and late fees when relevant
6. Provide concrete action items the user can follow immediately
7. Flag potential risks or compliance gaps proactively based on the user's actual data
8. Personalize responses using the company profile and current compliance status
9. When unsure, clearly state limitations and recommend consulting a qualified professional

You respond to any query in a professional manner. Always maintain a helpful and authoritative tone.`;

function getSystemPrompt() {
  return `${BASE_SYSTEM_PROMPT}\n\n${buildUserContext()}`;
}

// ---- Provider Handlers ----

async function callGemini(messages) {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;
  const timeout = withTimeout();

  try {
    const resp = await fetch(url, {
      method: "POST",
      signal: timeout.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: toGeminiContents(messages),
        systemInstruction: {
          parts: [{ text: getSystemPrompt() }],
        },
        generationConfig: {
          maxOutputTokens: MODEL_CONFIG.maxTokens,
          temperature: MODEL_CONFIG.temperature,
        },
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Gemini API error (${resp.status}): ${err.slice(0, 500)}`);
    }

    const json = await resp.json();
    const text = extractGeminiText(json);
    if (!text) throw new Error("Gemini returned an empty response");

    return text;
  } catch (err) {
    throw new Error(normalizeProviderError("Gemini failed:", err));
  } finally {
    timeout.clear();
  }
}

async function callGroq(messages) {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");

  const timeout = withTimeout();

  try {
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: timeout.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen/qwen3-32b",
        messages: toOpenAIMessages(messages),
        max_tokens: MODEL_CONFIG.maxTokens,
        temperature: MODEL_CONFIG.temperature,
        stream: false,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Groq API error (${resp.status}): ${err.slice(0, 500)}`);
    }

    const json = await resp.json();
    const text = extractOpenAIText(json);
    if (!text) throw new Error("Groq returned an empty response");

    return text;
  } catch (err) {
    throw new Error(normalizeProviderError("Groq failed:", err));
  } finally {
    timeout.clear();
  }
}

async function callOpenRouter(messages) {
  if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");

  const timeout = withTimeout();

  try {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: timeout.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "HTTP-Referer": "http://localhost:8080",
        "X-Title": "Nexus Compliance AI",
      },
      body: JSON.stringify({
        model: "google/gemma-3-27b-it:free",
        messages: toOpenAIMessages(messages),
        max_tokens: 200,
        temperature: MODEL_CONFIG.temperature,
      }),
    });

    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`OpenRouter API error (${resp.status}): ${err.slice(0, 500)}`);
    }

    const json = await resp.json();
    const text = extractOpenAIText(json);
    if (!text) throw new Error("OpenRouter returned an empty response");

    return text;
  } catch (err) {
    throw new Error(normalizeProviderError("OpenRouter failed:", err));
  } finally {
    timeout.clear();
  }
}

// Cascading fallback: Gemini → Groq → OpenRouter
async function getAIResponse(messages) {
  const providers = [
    { name: "Gemini", fn: callGemini, key: GEMINI_API_KEY },
    { name: "Groq", fn: callGroq, key: GROQ_API_KEY },
    { name: "OpenRouter", fn: callOpenRouter, key: OPENROUTER_API_KEY },
  ];

  const errors = [];

  for (const provider of providers) {
    if (!provider.key) {
      errors.push(`${provider.name}: API key not configured`);
      continue;
    }

    try {
      console.log(`🤖 Trying AI provider: ${provider.name}`);
      const text = await provider.fn(messages);
      console.log(`✅ ${provider.name} responded successfully`);
      return { text, provider: provider.name };
    } catch (err) {
      const message = err?.message || "Unknown error";
      console.warn(`⚠️ ${provider.name} failed: ${message}`);
      errors.push(`${provider.name}: ${message}`);
    }
  }

  throw new Error(errors.join(" | "));
}

// ---- Parse AI response for structured data ----
function parseResponse(text) {
  const risks = [];
  const actions = [];
  const lines = text.split("\n");
  let section = "";

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes("risk") && (lower.includes(":") || lower.includes("**"))) section = "risk";
    if (lower.includes("action") && (lower.includes(":") || lower.includes("**"))) section = "action";

    if (line.trim().startsWith("-") || line.trim().startsWith("•") || /^\d+\./.test(line.trim())) {
      const clean = line.replace(/^[\s\-•\d.]+/, "").trim();
      if (clean && section === "risk") risks.push(clean);
      else if (clean && section === "action") actions.push(clean);
    }
  }

  return { risks: risks.slice(0, 5), actions: actions.slice(0, 5) };
}

// GET /api/ai/history
router.get("/history", authenticate, (req, res) => {
  res.json({ success: true, data: store.chatHistory });
});

// POST /api/ai/message
router.post("/message", authenticate, async (req, res) => {
  const { content } = req.body;
  if (!content || !content.trim()) {
    return res.status(400).json({ success: false, error: "Message content is required." });
  }

  const userMsg = {
    id: store.generateId(),
    role: "user",
    content: content.trim(),
    timestamp: new Date().toISOString(),
  };
  store.chatHistory.push(userMsg);

  try {
    const context = store.chatHistory
      .filter((m) => m.role === "user" || m.role === "ai")
      .slice(-10);

    const { text: aiText, provider } = await getAIResponse(context);
    const { risks, actions } = parseResponse(aiText);

    const aiMsg = {
      id: store.generateId(),
      role: "ai",
      content: aiText,
      risks,
      actions,
      provider,
      timestamp: new Date().toISOString(),
    };

    store.chatHistory.push(aiMsg);
    return res.json({ success: true, data: aiMsg });
  } catch (err) {
    console.error("AI unavailable:", err?.message || err);
    return res.status(503).json({
      success: false,
      error: "AI service currently not available.",
      details: err?.message || "All providers failed",
    });
  }
});

// DELETE /api/ai/history
router.delete("/history", authenticate, (req, res) => {
  store.chatHistory.length = 0;
  store.chatHistory.push({
    id: "msg-init",
    role: "ai",
    content: "Hello! I'm your Compliance Assistant. I have access to your company data, compliance calendar, risk scores, and filing status. How can I help you today?",
    timestamp: new Date().toISOString(),
  });
  res.json({ success: true, data: null, message: "Chat history cleared." });
});

module.exports = router;
