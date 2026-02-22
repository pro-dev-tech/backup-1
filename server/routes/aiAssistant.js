// ============================================
// AI Assistant Routes – Cascading fallback: Gemini → Groq → OpenRouter
// ============================================

const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { GEMINI_API_KEY, OPENROUTER_API_KEY, GROQ_API_KEY } = require("../config/keys");
const store = require("../data/store");

const SYSTEM_PROMPT = `You are a professional Compliance Assistant specializing in Indian regulatory and business compliance. Your role is to provide accurate, actionable, and well-structured guidance on all compliance-related matters.

Core Expertise:
- Taxation: GST (filing, ITC, returns), Income Tax (TDS, advance tax, ITR), Professional Tax
- Corporate Law: MCA filings (AOC-4, MGT-7, DIR forms), ROC compliance, annual returns
- Securities: SEBI regulations, listing obligations, insider trading rules
- Labour & Employment: EPF, ESIC, Payment of Wages, Shops & Establishment Act, Labour Codes
- Banking & Finance: RBI guidelines, FEMA compliance, NBFC regulations
- Industry-Specific: MSME registration, Startup India, DPIIT compliance

Response Guidelines:
1. Always be professional, precise, and solution-oriented
2. Structure responses with clear headings, bullet points, and numbered steps
3. Cite relevant Indian laws, sections, rules, or notifications where applicable
4. Highlight deadlines, penalties, and late fees when relevant
5. Provide concrete action items the user can follow immediately
6. Flag potential risks or compliance gaps proactively
7. When unsure, clearly state limitations and recommend consulting a qualified professional

You respond to any query in a professional manner — whether it's about compliance, regulations, business operations, or general guidance. Always maintain a helpful and authoritative tone.`;

// ---- Provider Handlers ----

async function callGemini(messages) {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  const contents = messages.map((m) => ({
    role: m.role === "ai" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  contents.unshift({ role: "user", parts: [{ text: SYSTEM_PROMPT }] });
  if (contents.length > 1 && contents[0].role === contents[1].role) {
    contents.splice(1, 0, { role: "model", parts: [{ text: "Understood. I'm ready to help with your compliance queries." }] });
  }

  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Gemini API error (${resp.status}): ${err}`);
  }
  const json = await resp.json();
  return json.candidates?.[0]?.content?.parts?.[0]?.text || "I couldn't generate a response.";
}

async function callGroq(messages) {
  if (!GROQ_API_KEY) throw new Error("GROQ_API_KEY not configured");
  const formatted = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content })),
  ];
  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${GROQ_API_KEY}` },
    body: JSON.stringify({ model: "llama-3.3-70b-versatile", messages: formatted }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Groq API error (${resp.status}): ${err}`);
  }
  const json = await resp.json();
  return json.choices?.[0]?.message?.content || "I couldn't generate a response.";
}

async function callOpenRouter(messages) {
  if (!OPENROUTER_API_KEY) throw new Error("OPENROUTER_API_KEY not configured");
  const formatted = [
    { role: "system", content: SYSTEM_PROMPT },
    ...messages.map((m) => ({ role: m.role === "ai" ? "assistant" : "user", content: m.content })),
  ];
  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENROUTER_API_KEY}` },
    body: JSON.stringify({ model: "google/gemini-2.5-flash-preview", messages: formatted }),
  });
  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenRouter API error (${resp.status}): ${err}`);
  }
  const json = await resp.json();
  return json.choices?.[0]?.message?.content || "I couldn't generate a response.";
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
      const result = await provider.fn(messages);
      console.log(`✅ ${provider.name} responded successfully`);
      return result;
    } catch (err) {
      console.warn(`⚠️ ${provider.name} failed: ${err.message}`);
      errors.push(`${provider.name}: ${err.message}`);
    }
  }
  throw new Error(`All AI providers failed:\n${errors.join("\n")}`);
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
  if (!content || !content.trim()) return res.status(400).json({ success: false, error: "Message content is required." });

  const userMsg = { id: store.generateId(), role: "user", content: content.trim(), timestamp: new Date().toISOString() };
  store.chatHistory.push(userMsg);

  try {
    const context = store.chatHistory.filter((m) => m.role === "user" || m.role === "ai").slice(-10);
    const aiText = await getAIResponse(context);
    const { risks, actions } = parseResponse(aiText);

    const aiMsg = { id: store.generateId(), role: "ai", content: aiText, risks, actions, timestamp: new Date().toISOString() };
    store.chatHistory.push(aiMsg);
    res.json({ success: true, data: aiMsg });
  } catch (err) {
    console.error("AI error:", err.message);
    const fallback = {
      id: store.generateId(),
      role: "ai",
      content: `I'm currently unable to connect to any AI service. Please verify your API keys in the server/.env file.\n\nError details: ${err.message}\n\nIn the meantime, for compliance queries, I recommend checking the relevant government portals (GST Portal, MCA Portal, EPFO, ESIC) directly.`,
      risks: ["All AI providers are currently unavailable"],
      actions: ["Verify API keys in server/.env", "Check internet connectivity", "Try again in a few minutes"],
      timestamp: new Date().toISOString(),
    };
    store.chatHistory.push(fallback);
    res.json({ success: true, data: fallback });
  }
});

// DELETE /api/ai/history
router.delete("/history", authenticate, (req, res) => {
  store.chatHistory.length = 0;
  store.chatHistory.push({
    id: "msg-init",
    role: "ai",
    content: "Hello! I'm your Compliance Assistant. How can I help you with regulatory or business compliance today?",
    timestamp: new Date().toISOString(),
  });
  res.json({ success: true, data: null, message: "Chat history cleared." });
});

module.exports = router;
