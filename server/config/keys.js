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

  // AI Assistant – Cascading: Gemini → Groq → OpenRouter
  GEMINI_API_KEY: clean(process.env.GEMINI_API_KEY),
  GROQ_API_KEY: clean(process.env.GROQ_API_KEY),
  OPENROUTER_API_KEY: clean(process.env.OPENROUTER_API_KEY),

  // News – Event Registry (newsapi.ai)
  EVENTREGISTRY_API_KEY: clean(process.env.EVENTREGISTRY_API_KEY),

  // Integration / Compliance AI Engine (SEPARATE from AI Assistant)
  // Cascading: Groq (primary) → OpenRouter (fallback-1) → Gemini (fallback-2)
  INTEGRATION_GROQ_API_KEY: clean(process.env.INTEGRATION_GROQ_API_KEY),
  INTEGRATION_OPENROUTER_API_KEY: clean(process.env.INTEGRATION_OPENROUTER_API_KEY),
  INTEGRATION_GEMINI_API_KEY: clean(process.env.INTEGRATION_GEMINI_API_KEY),
};
