// ============================================
// AI Assistant Routes – Multi-provider (Gemini / OpenRouter / Groq)
// ============================================

const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { GEMINI_API_KEY, OPENROUTER_API_KEY, GROQ_API_KEY, AI_PROVIDER } = require("../config/keys");
const store = require("../data/store");

const SYSTEM_PROMPT = `You are an AI Compliance Assistant for Indian MSMEs. You specialize in:
- GST, Income Tax, TDS, MCA, SEBI, EPF, ESIC, Professional Tax, Shops & Establishment Act
- Indian regulatory compliance for small and medium enterprises
- Risk assessment and penalty calculations
- Filing deadlines and procedural guidance

Always respond in a structured format. When applicable, include:
1. Key points or analysis
2. Risks (list potential penalties or compliance gaps)
3. Action items (concrete next steps)

Be concise, accurate, and cite relevant Indian laws/sections when possible.`;

// ---- Provider Handlers ----

async function callGemini(messages) {
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY not configured");
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;
  const contents = messages.map((m) => ({
    role: m.role === "ai" ? "model" : "user",
    parts: [{ text: m.content }],
  }));
  // Prepend system instruction as first user message
  contents.unshift({ role: "user", parts: [{ text: SYSTEM_PROMPT }] });
  if (contents.length > 1 && contents[0].role === contents[1].role) {
    contents.splice(1, 0, { role: "model", parts: [{ text: "Understood. I'm ready to help with Indian MSME compliance queries." }] });
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

async function getAIResponse(messages) {
  switch (AI_PROVIDER) {
    case "openrouter": return callOpenRouter(messages);
    case "groq": return callGroq(messages);
    case "gemini":
    default: return callGemini(messages);
  }
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

  // Save user message
  const userMsg = { id: store.generateId(), role: "user", content: content.trim(), timestamp: new Date().toISOString() };
  store.chatHistory.push(userMsg);

  try {
    // Get recent context (last 10 messages)
    const context = store.chatHistory.filter((m) => m.role === "user" || m.role === "ai").slice(-10);
    const aiText = await getAIResponse(context);
    const { risks, actions } = parseResponse(aiText);

    const aiMsg = { id: store.generateId(), role: "ai", content: aiText, risks, actions, timestamp: new Date().toISOString() };
    store.chatHistory.push(aiMsg);
    res.json({ success: true, data: aiMsg });
  } catch (err) {
    console.error("AI error:", err.message);
    // Fallback mock response
    const fallback = {
      id: store.generateId(),
      role: "ai",
      content: `I'm having trouble connecting to the AI service (${AI_PROVIDER}). Here's a general response:\n\nBased on your query about "${content.slice(0, 50)}...", I recommend reviewing the applicable Indian compliance requirements. Please check your API key configuration and try again.`,
      risks: ["AI service temporarily unavailable"],
      actions: ["Check .env API key configuration", "Try switching AI_PROVIDER in .env"],
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
    content: "Hello! I'm your AI Compliance Assistant. How can I help you today?",
    timestamp: new Date().toISOString(),
  });
  res.json({ success: true, data: null, message: "Chat history cleared." });
});

module.exports = router;
