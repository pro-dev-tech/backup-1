// ============================================
// Development Server – Runs Express + Vite in a single process
// Usage: node server/dev.js
// ============================================

const { spawn } = require("child_process");
const path = require("path");

const ROOT_DIR = path.join(__dirname, "..");

console.log("🚀 Starting Nexus Compliance AI (Development Mode)...\n");

// Start Express backend
const backend = spawn("node", ["--watch", "index.js"], {
  cwd: __dirname,
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "development" },
});

// Start Vite frontend dev server (avoid shell: true to prevent deprecation warning)
const frontend = spawn(
  process.platform === "win32" ? "npx.cmd" : "npx",
  ["vite", "--port", "8080", "--host"],
  {
    cwd: ROOT_DIR,
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "development" },
  }
);

function cleanup() {
  console.log("\n🛑 Shutting down...");
  backend.kill();
  frontend.kill();
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);

backend.on("exit", (code) => {
  if (code !== null && code !== 0) {
    console.error(`❌ Backend exited with code ${code}`);
    frontend.kill();
    process.exit(code);
  }
});

frontend.on("exit", (code) => {
  if (code !== null && code !== 0) {
    console.error(`❌ Frontend exited with code ${code}`);
    backend.kill();
    process.exit(code);
  }
});
