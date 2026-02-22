// ============================================
// Configuration – loads .env and exports config
// ============================================

require("dotenv").config();

module.exports = {
  PORT: process.env.PORT || 5000,
  JWT_SECRET: process.env.JWT_SECRET || "fallback_dev_secret_change_me",

  // AI Providers – Cascading: Gemini (default) → Groq (fallback-1) → OpenRouter (fallback-2)
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || "",
  GROQ_API_KEY: process.env.GROQ_API_KEY || "",
  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || "",

  // News
  NEWSDATA_API_KEY: process.env.NEWSDATA_API_KEY || "",
};
