// ============================================
// Compliance AI Engine – Separate from AI Assistant
// Uses Groq (primary) → OpenRouter (fallback)
// AI only explains/parses – does NOT decide compliance
// ============================================

const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const { COMPLIANCE_GROQ_API_KEY, COMPLIANCE_OPENROUTER_API_KEY } = require("../config/keys");

const SYSTEM_PROMPT = `You are a Compliance Rule Engine Analyst for Indian regulatory compliance. Your role is strictly to EXPLAIN compliance violations and risk scores — you do NOT make compliance decisions.

When explaining violations:
- State the violation clearly and its business impact
- Cite the exact legal section, act, and rule
- Describe potential penalties with specific amounts
- Provide 3-5 actionable remediation steps
- Use bullet points and clear structure

When explaining compliance scores:
- Break down how each violation affects the score
- Prioritize violations by severity (High → Medium → Low)
- Recommend specific actions to improve the score
- Reference applicable Indian laws

Tone: Legal, authoritative, enterprise-grade, trustworthy.
Format: Use markdown headings, bullet points, and bold for key terms.`;

async function callGroq(messages) {
  if (!COMPLIANCE_GROQ_API_KEY) throw new Error("Compliance Groq API key not configured");

  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${COMPLIANCE_GROQ_API_KEY}`,
    },
    body: JSON.stringify({
      model: "qwen/qwen3-32b",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 1500,
      temperature: 0.4,
      stream: false,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Groq error (${resp.status}): ${err.slice(0, 300)}`);
  }

  const json = await resp.json();
  const text = json.choices?.[0]?.message?.content || "";
  if (!text) throw new Error("Groq returned empty response");
  return text;
}

async function callOpenRouter(messages) {
  if (!COMPLIANCE_OPENROUTER_API_KEY) throw new Error("Compliance OpenRouter API key not configured");

  const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${COMPLIANCE_OPENROUTER_API_KEY}`,
      "HTTP-Referer": "http://localhost:8080",
      "X-Title": "Nexus Compliance Rule Engine",
    },
    body: JSON.stringify({
      model: "google/gemma-3-27b-it:free",
      messages: [{ role: "system", content: SYSTEM_PROMPT }, ...messages],
      max_tokens: 1000,
      temperature: 0.4,
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`OpenRouter error (${resp.status}): ${err.slice(0, 300)}`);
  }

  const json = await resp.json();
  const text = json.choices?.[0]?.message?.content || "";
  if (!text) throw new Error("OpenRouter returned empty response");
  return text;
}

async function getAIExplanation(messages) {
  const providers = [
    { name: "Groq", fn: callGroq, key: COMPLIANCE_GROQ_API_KEY },
    { name: "OpenRouter", fn: callOpenRouter, key: COMPLIANCE_OPENROUTER_API_KEY },
  ];

  for (const provider of providers) {
    if (!provider.key) continue;
    try {
      console.log(`🔧 Compliance AI: Trying ${provider.name}...`);
      const text = await provider.fn(messages);
      console.log(`✅ Compliance AI: ${provider.name} responded`);
      return { text, provider: provider.name };
    } catch (err) {
      console.warn(`⚠️ Compliance AI ${provider.name} failed:`, err.message);
    }
  }

  throw new Error("All compliance AI providers failed. Check COMPLIANCE_GROQ_API_KEY or COMPLIANCE_OPENROUTER_API_KEY.");
}

// POST /api/compliance-ai/explain – SSE streaming explanation
router.post("/explain", authenticate, async (req, res) => {
  const { context } = req.body;
  if (!context) {
    return res.status(400).json({ success: false, error: "Context is required." });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  try {
    const { text, provider } = await getAIExplanation([{ role: "user", content: context }]);

    // Stream word by word
    const words = text.split(/(\s+)/);
    for (let i = 0; i < words.length; i++) {
      res.write(`data: ${JSON.stringify({ word: words[i] })}\n\n`);
      if (i % 3 === 0) await new Promise((r) => setTimeout(r, 20));
    }

    res.write(`data: ${JSON.stringify({ provider })}\n\n`);
    res.write("data: [DONE]\n\n");
  } catch (err) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.write("data: [DONE]\n\n");
  }

  res.end();
});

module.exports = router;
