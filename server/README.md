# Nexus Compliance AI – Full Stack Application

## Quick Start (One Command)

### Prerequisites
- **Node.js** v18+ installed
- **npm** installed

### 1. Install Dependencies

```bash
# Install frontend dependencies (from project root)
npm install

# Install backend dependencies
cd server && npm install && cd ..
```

### 2. Configure Environment Variables

```bash
# Copy the example env file
cp server/.env.example server/.env
```

Edit `server/.env` and replace the placeholder values:

| Variable | Required | Description | Where to get it |
|---|---|---|---|
| `JWT_SECRET` | ✅ Yes | Any random string (32+ chars) | Generate: `openssl rand -hex 32` |
| `GEMINI_API_KEY` | ✅ (if using Gemini) | Google AI key | [Google AI Studio](https://aistudio.google.com/apikey) |
| `OPENROUTER_API_KEY` | ⬜ Optional | OpenRouter key | [OpenRouter](https://openrouter.ai/keys) |
| `GROQ_API_KEY` | ⬜ Optional | Groq key | [Groq Console](https://console.groq.com/keys) |
| `NEWSDATA_API_KEY` | ⬜ Optional | News feed data | [NewsData.io](https://newsdata.io/register) |
| `AI_PROVIDER` | ✅ Yes | `gemini`, `openrouter`, or `groq` | Choose one |

### 3. Run the App

#### Development Mode (single command, hot reload)
```bash
cd server
npm run dev
```
This starts **both** the Express backend (port 5000) and Vite frontend dev server (port 8080) in a single terminal.

- 🌐 **Open:** http://localhost:8080
- 📡 API calls are proxied from :8080 → :5000 automatically
- 🔄 Both frontend and backend auto-reload on file changes

#### Production Mode
```bash
# Build the frontend first (from project root)
npm run build

# Start the production server
cd server
npm run prod
```
- 🌐 **Open:** http://localhost:5000
- Express serves both the API and the built React app

## Demo Login Credentials

| Email | Password | Role |
|---|---|---|
| `rahul@acmepvt.com` | `admin123` | Admin |

## Architecture

```
┌─────────────────────────────────────────┐
│           Single Server (Node.js)        │
│                                          │
│  ┌──────────┐     ┌──────────────────┐  │
│  │  Express  │────▶│  API Routes      │  │
│  │  Server   │     │  /api/auth       │  │
│  │  :5000    │     │  /api/ai         │  │
│  │           │     │  /api/news       │  │
│  └──────────┘     │  /api/dashboard   │  │
│       │           │  /api/calendar    │  │
│       │           │  /api/risk        │  │
│       ▼           │  /api/reports     │  │
│  ┌──────────┐     │  /api/integrations│  │
│  │  Static   │     │  /api/settings   │  │
│  │  Files    │     └──────────────────┘  │
│  │  (dist/)  │                           │
│  └──────────┘                            │
│                                          │
│  Dev: Vite proxy :8080 → :5000          │
│  Prod: Express serves dist/ directly    │
└─────────────────────────────────────────┘
```

## Frontend ↔ Backend Connection

The frontend calls backend APIs via `/api/*` routes:
- **Development:** Vite proxies `/api/*` requests from port 8080 to Express on port 5000
- **Production:** Express serves both the built React app and API from port 5000
- **Fallback:** If the backend is unreachable, the frontend gracefully falls back to demo/mock data

## API Endpoints

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | ❌ | Login (email, password, role) |
| POST | `/api/auth/register` | ❌ | Register new user |
| GET | `/api/auth/session` | ✅ | Get current session |
| PUT | `/api/auth/profile` | ✅ | Update profile |
| POST | `/api/auth/logout` | ❌ | Logout |
| GET | `/api/auth/managed-users` | ✅ Admin | List managed users |
| POST | `/api/auth/managed-users` | ✅ Admin | Add managed user |
| DELETE | `/api/auth/managed-users/:id` | ✅ Admin | Remove managed user |
| PATCH | `/api/auth/managed-users/:id/toggle` | ✅ Admin | Toggle user active state |
| GET | `/api/dashboard` | ✅ | Dashboard data + charts |
| GET | `/api/calendar` | ✅ | Calendar events |
| POST | `/api/calendar` | ✅ | Add calendar event |
| DELETE | `/api/calendar/:id` | ✅ | Delete event |
| POST | `/api/compliance/check` | ✅ | Run compliance check |
| GET | `/api/risk` | ✅ | Risk data |
| GET | `/api/reports` | ✅ | All reports |
| POST | `/api/reports/generate` | ✅ | Generate new report |
| GET | `/api/integrations` | ✅ | All integrations |
| GET | `/api/news` | ✅ | News articles |
| POST | `/api/ai/message` | ✅ | Send AI chat message |
| GET | `/api/ai/history` | ✅ | Get chat history |
| DELETE | `/api/ai/history` | ✅ | Clear chat |
| GET | `/api/settings` | ✅ | User settings |
| GET | `/api/health` | ❌ | Health check |

## Features by API Key

| Feature | Works without API keys | Enhanced with API key |
|---|---|---|
| Dashboard | ✅ Demo data | Same |
| Calendar | ✅ Demo events | Same |
| Compliance Checker | ✅ Rule engine | Same |
| Risk Monitor | ✅ Demo data | Same |
| Reports | ✅ Demo reports | Same |
| AI Assistant | ✅ Mock responses | ✅ Real AI (Gemini/OpenRouter/Groq) |
| News Feed | ✅ Fallback articles | ✅ Live news (NewsData.io) |

## Security Features

- JWT authentication with 24h expiry
- bcrypt password hashing
- Helmet security headers
- CORS restricted to localhost origins
- Rate limiting (200 req/15min general, 10 req/min for AI)
- Role-based authorization (admin, finance, auditor)
