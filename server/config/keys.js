// ============================================
// Configuration – loads .env and exports config
// ============================================

const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "..", ".env") });

function clean(value) {
  return (value || "").trim().replace(/^['"]|['"]$/g, "");
}

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: clean(process.env.JWT_SECRET) || "fallback_dev_secret_change_me",

  // AI Providers – Cascading: Gemini (default) → Groq (fallback-1) → OpenRouter (fallback-2)
  GEMINI_API_KEY: clean(process.env.GEMINI_API_KEY),
  GROQ_API_KEY: clean(process.env.GROQ_API_KEY),
  OPENROUTER_API_KEY: clean(process.env.OPENROUTER_API_KEY),

  // News – Event Registry (newsapi.ai)
  EVENTREGISTRY_API_KEY: clean(process.env.EVENTREGISTRY_API_KEY),

  // Compliance AI Engine (separate from AI Assistant)
  COMPLIANCE_GROQ_API_KEY: clean(process.env.COMPLIANCE_GROQ_API_KEY) || clean(process.env.GROQ_API_KEY),
  COMPLIANCE_OPENROUTER_API_KEY: clean(process.env.COMPLIANCE_OPENROUTER_API_KEY) || clean(process.env.OPENROUTER_API_KEY),
};
