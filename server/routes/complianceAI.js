// ============================================
// Compliance AI Engine – SEPARATE from AI Assistant
// Fresh API keys: INTEGRATION_GROQ → INTEGRATION_OPENROUTER → INTEGRATION_GEMINI
// AI only explains/parses – does NOT decide compliance
// ============================================

const router = require("express").Router();
const { authenticate } = require("../middleware/auth");
const {
  INTEGRATION_GROQ_API_KEY,
  INTEGRATION_OPENROUTER_API_KEY,
  INTEGRATION_GEMINI_API_KEY,
} = require("../config/keys");

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

When parsing documents:
- Extract all relevant compliance fields from the provided document content
- Return structured JSON with extracted fields
- Flag any ambiguous or missing data
- Map extracted fields to the platform's expected schema

Tone: Legal, authoritative, enterprise-grade, trustworthy.
Format: Use markdown headings, bullet points, and bold for key terms.`;

const PARSE_SYSTEM_PROMPT = `You are a Document Parsing Engine for Indian regulatory compliance. Your role is to extract structured compliance data from uploaded documents (CSV, PDF text, XML, etc.).

CRITICAL: You MUST respond with ONLY a valid JSON object. No markdown, no explanation, no code blocks.

Extract all relevant fields and return them as a flat JSON object with snake_case keys.
For numeric values, return numbers (not strings).
For boolean values, return true/false.
For dates, return ISO date strings.
If a field is missing or unclear, omit it.

Common fields to look for:
- tax_collected, tax_reported, filing_date, due_date (GSTN)
- pf_deduction_percent, employer_contribution, expected_contribution, deposit_date (EPFO)
- annual_return_filed, director_kyc_expiry, incorporation_filing_missing (MCA21)
- tds_claimed, tds_26as, return_filing_date, advance_tax_paid, advance_tax_due (Income Tax)
- gst_ledger_mapped, unclassified_transactions, missing_tax_category (TallyPrime)
- invoice_tax_total, duplicate_invoices, invalid_gst_rates (Zoho Books)`;

const REQUEST_TIMEOUT_MS = 30000;

function withTimeout(ms = REQUEST_TIMEOUT_MS) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

// ---- Provider: Groq ----
async function callGroq(messages, systemPrompt) {
  if (!INTEGRATION_GROQ_API_KEY) throw new Error("INTEGRATION_GROQ_API_KEY not configured");
  const timeout = withTimeout();
  try {
    const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      signal: timeout.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${INTEGRATION_GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "qwen/qwen3-32b",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: 2000,
        temperature: 0.3,
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
  } finally {
    timeout.clear();
  }
}

// ---- Provider: OpenRouter ----
async function callOpenRouter(messages, systemPrompt) {
  if (!INTEGRATION_OPENROUTER_API_KEY) throw new Error("INTEGRATION_OPENROUTER_API_KEY not configured");
  const timeout = withTimeout();
  try {
    const resp = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: timeout.signal,
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${INTEGRATION_OPENROUTER_API_KEY}`,
        "HTTP-Referer": "http://localhost:8080",
        "X-Title": "Nexus Compliance Rule Engine",
      },
      body: JSON.stringify({
        model: "google/gemma-3-27b-it:free",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        max_tokens: 1500,
        temperature: 0.3,
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
  } finally {
    timeout.clear();
  }
}

// ---- Provider: Gemini ----
async function callGemini(messages, systemPrompt) {
  if (!INTEGRATION_GEMINI_API_KEY) throw new Error("INTEGRATION_GEMINI_API_KEY not configured");
  const timeout = withTimeout();
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${INTEGRATION_GEMINI_API_KEY}`;
    const contents = messages.map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));
    const resp = await fetch(url, {
      method: "POST",
      signal: timeout.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: { parts: [{ text: systemPrompt }] },
        generationConfig: { maxOutputTokens: 2000, temperature: 0.3 },
      }),
    });
    if (!resp.ok) {
      const err = await resp.text();
      throw new Error(`Gemini error (${resp.status}): ${err.slice(0, 300)}`);
    }
    const json = await resp.json();
    const parts = json?.candidates?.[0]?.content?.parts || [];
    const text = parts.map((p) => p.text || "").join("").trim();
    if (!text) throw new Error("Gemini returned empty response");
    return text;
  } finally {
    timeout.clear();
  }
}

// ---- Cascading provider: Groq → OpenRouter → Gemini ----
async function getAIResponse(messages, systemPrompt = SYSTEM_PROMPT) {
  const providers = [
    { name: "Groq", fn: callGroq, key: INTEGRATION_GROQ_API_KEY },
    { name: "OpenRouter", fn: callOpenRouter, key: INTEGRATION_OPENROUTER_API_KEY },
    { name: "Gemini", fn: callGemini, key: INTEGRATION_GEMINI_API_KEY },
  ];

  for (const provider of providers) {
    if (!provider.key) continue;
    try {
      console.log(`🔧 Integration AI: Trying ${provider.name}...`);
      const text = await provider.fn(messages, systemPrompt);
      console.log(`✅ Integration AI: ${provider.name} responded`);
      return { text, provider: provider.name };
    } catch (err) {
      console.warn(`⚠️ Integration AI ${provider.name} failed:`, err.message);
    }
  }

  throw new Error("All integration AI providers failed. Configure INTEGRATION_GROQ_API_KEY, INTEGRATION_OPENROUTER_API_KEY, or INTEGRATION_GEMINI_API_KEY.");
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
    const { text, provider } = await getAIResponse([{ role: "user", content: context }], SYSTEM_PROMPT);

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

// POST /api/compliance-ai/parse – AI-powered document parsing
router.post("/parse", authenticate, async (req, res) => {
  const { content, platform, filename } = req.body;
  if (!content) {
    return res.status(400).json({ success: false, error: "Document content is required." });
  }

  try {
    const prompt = `Parse the following ${filename || "document"} for ${platform || "compliance"} platform. Extract all structured compliance data fields as a flat JSON object.\n\nDocument content:\n${content.slice(0, 15000)}`;
    const { text, provider } = await getAIResponse([{ role: "user", content: prompt }], PARSE_SYSTEM_PROMPT);

    // Try to extract JSON from response
    let parsed = null;
    try {
      // Try direct JSON parse
      parsed = JSON.parse(text);
    } catch {
      // Try extracting JSON from markdown code blocks
      const jsonMatch = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
      if (jsonMatch) {
        try { parsed = JSON.parse(jsonMatch[1]); } catch {}
      }
      // Try finding first { ... } block
      if (!parsed) {
        const braceMatch = text.match(/\{[\s\S]*\}/);
        if (braceMatch) {
          try { parsed = JSON.parse(braceMatch[0]); } catch {}
        }
      }
    }

    if (!parsed || typeof parsed !== "object") {
      return res.status(422).json({ success: false, error: "AI could not extract structured data from this document. Try a CSV or JSON format.", rawResponse: text.slice(0, 500) });
    }

    res.json({ success: true, data: parsed, provider, message: `Parsed ${Object.keys(parsed).length} fields using ${provider}` });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
