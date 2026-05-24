# Global Sustainable Tourism AI Lab

**English** | [繁體中文](README.zh-TW.md)

[![Live Demo](https://img.shields.io/badge/Live_Demo-online-22C55E?logo=cloudflare&logoColor=white)](https://global-sustainable-tourism-lab-c73.pages.dev/)
![Last commit](https://img.shields.io/github/last-commit/EF101510/global-sustainable-tourism-lab)
![Repo size](https://img.shields.io/github/repo-size/EF101510/global-sustainable-tourism-lab)

> A web-based teaching aid for English teachers — students explore "overtourism" issues across 25 cities worldwide, in English.

Students spin a draggable 3D digital globe, tap a city to open a deep-dive page with real-world cases, chat with an AI advisor to diagnose sustainability strategies, run a carrying-capacity calculation, and finally post their own "24-Hour Smart Visitor Cap Plan" to a shared board to learn alongside students around the world.

---

## ✨ Features

- **Interactive 3D globe** (Three.js) — drag to rotate, scroll / pinch to zoom, tap a city marker to enter. Works with desktop mouse and phone/tablet touch.
- **25 city deep-dive pages**
  - 4K timelapse background carousel (Ken Burns effect)
  - City overview (features / environment / geography / products / economy)
  - Core-challenge cards with real cases (e.g. Venice's €5 day-trip fee, Barcelona's 2028 Airbnb ban)
  - **Carrying-capacity calculator**: `C = A × U_f / R_t`, with optional AI-estimated inputs
- **AI sustainability chat** — calls the Anthropic Claude API through a `/api/chat` backend proxy (the API key never reaches the browser)
- **Student board** — one per city, posts stored in Cloudflare Workers KV and shared globally
- **Teacher admin** (`/admin`) — view / edit / delete posts across cities, change credentials
- **Accessibility helpers** — font-size control, full-screen Preview mode
- **Responsive** — full iPhone / iPad touch support

---

## 🧱 Tech Stack

| Area | Technology |
|------|------------|
| Framework | React 18 + Vite + TypeScript |
| 3D / globe | Three.js (procedural continents + world-atlas TopoJSON coastlines) |
| Styling | Tailwind CSS |
| Icons | lucide-react |
| AI | Anthropic Claude API (via `/api/chat` proxy) |
| Markdown | react-markdown (chat message rendering) |
| Storage | Cloudflare Workers KV (board, admin credentials) |
| Deployment | Cloudflare Pages + Pages Functions |

---

## 🚀 Local Development

**Requirements:** Node.js 18+ and an Anthropic API key.

```sh
# 1. Install dependencies
npm install

# 2. Configure environment variables
cp .env.example .env.local
#   Edit .env.local and fill in at least ANTHROPIC_API_KEY

# 3. Start the dev server
npm run dev
#   Default: http://localhost:5173
#   To test on a real phone/tablet: npm run dev -- --host, then open the Network URL
```

> **Restart `npm run dev` after editing `.env.local`.** `vite.config.ts` reads it once at startup via Vite's `loadEnv` and injects the values into the dev `/api/chat` middleware. These `ANTHROPIC_*` variables live only on the Node side and are never bundled into the frontend.

### Environment variables

| Variable | Required | Description |
|----------|:---:|------|
| `ANTHROPIC_API_KEY` | ✅ | Anthropic API key |
| `ANTHROPIC_MODEL` | — | Chat model, defaults to `claude-opus-4-7` (opus / sonnet / haiku — see `.env.example`) |
| `ANTHROPIC_EFFORT` | — | Reasoning effort `low\|medium\|high\|xhigh\|max`; leave empty to let the model decide (must be empty for Haiku) |

### Scripts

```sh
npm run dev       # Dev server (with /api/chat, /api/board, /api/admin middleware)
npm run build     # Type-check + production build into dist/
npm run preview   # Preview the production build locally
npm run lint      # Type-check only (tsc --noEmit)
```

---

## 📁 Project Structure

```
src/
├─ pages/                  Routed pages
│  ├─ GlobePage.tsx          /          globe home
│  ├─ CityDashboardPage.tsx  /city/:id  city deep-dive
│  └─ AdminPage.tsx          /admin     teacher admin
├─ components/             Globe, AIChat, StudentBoard, carrying-capacity calc, ...
├─ data/                  cities, city-details, carrying-capacity
├─ lib/                   three-globe, chat-api, country-flags, ...
├─ hooks/                 useScrollLock, useBackgroundCarousel
└─ server/               Backend core shared by dev & prod
   ├─ chat-handler.ts       Anthropic proxy (prompt caching, adaptive thinking)
   ├─ board-handler.ts      Board CRUD (editToken model + admin ops)
   └─ admin-handler.ts      Admin auth (PBKDF2-SHA-256)

functions/api/            Cloudflare Pages Functions (production backend)
vite.config.ts            Dev server + /api/* middleware (shares src/server/*)
wrangler.toml             Cloudflare config (KV binding: BOARD)
```

> Dev (`vite.config.ts` middleware) and production (`functions/api/*`) share the same `src/server/*-handler.ts`, so there's only one copy of the backend logic.

---

## ☁️ Deploy to Cloudflare Pages

The frontend and `/api/*` deploy to a single Cloudflare Pages project.

```sh
# One-time setup
npm i -g wrangler
wrangler login
wrangler pages project create global-sustainable-tourism-lab

wrangler kv namespace create BOARD          # paste the id into wrangler.toml
wrangler pages secret put ANTHROPIC_API_KEY --project-name=global-sustainable-tourism-lab
#   ANTHROPIC_MODEL / ANTHROPIC_EFFORT are plain text in wrangler.toml [vars]

# Every deploy
npm run build
wrangler pages deploy dist --project-name=global-sustainable-tourism-lab
```
Or connect the git repo in the Pages dashboard for auto-deploy on push.

---

## 🔑 Admin (`/admin`)

A teacher-only post-management UI (students don't see a link; open the URL directly).

- **Default credentials:** `admin` / `admin123`
- **Change the password right after first login** — top-right "Settings" → set a new username + password (≥ 6 chars). The new credentials are hashed with PBKDF2-SHA-256 (100k iterations) into KV, and the defaults stop working.
- **Forgot the changed password?** `wrangler kv key delete --binding=BOARD admin:credentials` clears the record, after which `admin / admin123` works again.

---

## 📝 License / Usage

For educational use. City background images come mostly from Unsplash and Wikimedia Commons — please respect their respective licenses.
