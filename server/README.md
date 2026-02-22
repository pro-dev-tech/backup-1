# Nexus Compliance AI – Backend Server

## Quick Start

```bash
cd server
npm install
cp .env.example .env    # Edit .env with your real API keys
npm start               # Starts on http://localhost:5000
```

For auto-reload during development:
```bash
npm run dev
```

## API Keys Required

| Key | Provider | Get it from |
|-----|----------|-------------|
| `GEMINI_API_KEY` | Google Gemini | https://aistudio.google.com/apikey |
| `OPENROUTER_API_KEY` | OpenRouter | https://openrouter.ai/keys |
| `GROQ_API_KEY` | Groq | https://console.groq.com/keys |
| `NEWSDATA_API_KEY` | NewsData.io | https://newsdata.io/register |

Set `AI_PROVIDER` in `.env` to choose which AI powers the assistant: `gemini`, `openrouter`, or `groq`.

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
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
| GET | `/api/dashboard/score` | ✅ | Compliance score only |
| GET | `/api/calendar` | ✅ | Calendar events (?month=&year=) |
| POST | `/api/calendar` | ✅ | Add calendar event |
| PATCH | `/api/calendar/:id/status` | ✅ | Update event status |
| DELETE | `/api/calendar/:id` | ✅ | Delete event |
| POST | `/api/compliance/check` | ✅ | Run compliance check (turnover, employees) |
| GET | `/api/risk` | ✅ | Risk data (factors + rules) |
| GET | `/api/risk/factors` | ✅ | Risk factors only |
| GET | `/api/risk/rules` | ✅ | Rule engine only |
| GET | `/api/reports` | ✅ | All reports (?type=PDF) |
| POST | `/api/reports/generate` | ✅ | Generate new report |
| DELETE | `/api/reports/:id` | ✅ | Delete report |
| GET | `/api/integrations` | ✅ | All integrations |
| POST | `/api/integrations/:id/connect` | ✅ | Connect integration |
| POST | `/api/integrations/:id/disconnect` | ✅ | Disconnect integration |
| POST | `/api/integrations/:id/sync` | ✅ | Sync integration |
| GET | `/api/news` | ✅ | News articles (?category=GST) |
| GET | `/api/news/categories` | ✅ | News categories |
| GET | `/api/news/:id` | ✅ | Single article |
| GET | `/api/ai/history` | ✅ | Chat history |
| POST | `/api/ai/message` | ✅ | Send message to AI |
| DELETE | `/api/ai/history` | ✅ | Clear chat history |
| GET | `/api/settings` | ✅ | User settings |
| PUT | `/api/settings/profile` | ✅ | Update profile settings |
| PUT | `/api/settings/company` | ✅ | Update company settings |
| PUT | `/api/settings/notifications` | ✅ | Update notification prefs |
| PUT | `/api/settings/twofa` | ✅ | Toggle 2FA |
| PUT | `/api/settings/appearance` | ✅ | Update theme/color |
| POST | `/api/settings/change-password` | ✅ | Change password |
| GET | `/api/health` | ❌ | Health check |

## Default Login Credentials

- **Email:** `rahul@acmepvt.com`
- **Password:** `admin123`
- **Role:** `admin`

## Security Features

- JWT authentication with 24h expiry
- bcrypt password hashing
- Helmet security headers
- CORS restricted to localhost origins
- Rate limiting (200 req/15min general, 10 req/min for AI)
- Role-based authorization (admin, finance, auditor)
