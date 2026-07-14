## Interlink – Hackathon README

Welcome to **Interlink**, our commuter-student matchmaking and hangout-planning prototype built during the Hack SBU sprint. Interlink helps students find like-minded peers, align schedules in minutes, and spin up campus meetups—powered by smart data hygiene, AI-assisted planning, and a polished end-to-end experience.

---

### Why Interlink

- **Campus connection superpower**: commuters drop availability, interests, and courses to discover curated matches that feel human.
- **From match to meetup**: every connection includes shared availability highlights plus an instant AI-generated hangout plan with deterministic fallback.
- **Rapid iteration ready**: the stack runs locally, swaps between sample data and Supabase, and is instrumented for future growth.

---

### Architecture at a Glance

- **Frontend** – React + TypeScript + Vite SPA (`frontend/`)
  - Find Friend flow (`components/find-friend/`) with mode selector, schedule preview, matches list, and activity ideas.
  - Schedule builder using `react-big-calendar`, optimistic sync (`useScheduleManager`), conflict detection, and friendly alerts.
  - Authenticated pages (Dashboard, Friends, Hangout Planner, etc.) wrapped by a shared `AuthContext`.
- **Backend** – Express APIs (`backend/`)
  - Matchmaking domain (`matchmaking/`) handles schedule overlap math, semantic affinity scoring, group matchmaking, and debug logging.
  - AI services (`activitySuggestionService.js`) integrate Google Gemini with sanitizer guardrails and deterministic fallback content.
  - Auth, Connections, Inbox, and Schedule modules (Supabase-ready) with in-memory stores for hackathon agility.
- **Shared practices**
  - Bidirectional sanitizers (`sanitizeUser`, `sanitizeSeeker`, `sanitizeInstagram`) ensure consistent payload hygiene.
  - Structured errors (`MatchmakingApiError` mirror) and typed DTOs keep the UX resilient.
  - SQL migrations (`backend/db/migrations/`) lay groundwork for a Postgres schema.

---

### Feature Highlights

- 🧭 **Smart matchmaking** – compatibility breakdowns (schedule, affinity, hobbies, interests, major bonus) and cluster tagging for pairs and groups.
- 📅 **Schedule intelligence** – drag-and-drop free-time slots, overlap detection, auto-save hashing, and contextual messaging.
- 🤖 **AI hangout concierge** – Gemini-backed activity suggestions and hangout agendas with JSON prompts, fallbacks, and environment gating.
- 🔗 **Connections hub** – friend request APIs with swap-in persistence, mirrored by `connectionsApi.ts` and `FriendsPage.tsx`.
- 🧼 **Input sanitization everywhere** – Instagram normalization, string list trimming, payload dedupe, and safe defaults across the stack.

---

### Getting Started

#### Prerequisites

- Node.js 20+
- pnpm (or npm)
- Supabase + Google Gemini keys (optional; stubs available)

#### Quickstart

```bash
# From the repository root
npm install
npm --prefix backend install
npm --prefix frontend install
cp backend/env.example backend/.env
cp frontend/env.example frontend/.env
npm run dev                  # backend :3001, frontend :5173
```

Visit `http://localhost:5173`. Stubbed auth instructions appear on the login screen. The Find Friend page seeds sample data and calls live matchmaking endpoints.

---

### Key API Endpoints

| Method   | Endpoint                            | Purpose                    | Notes                                                         |
| -------- | ----------------------------------- | -------------------------- | ------------------------------------------------------------- |
| POST     | `/api/matchmaking/matches`          | Generate match previews    | Requires `mode`, `slots`, optional seeker profile and filters |
| POST     | `/api/matchmaking/activity-ideas`   | AI-curated activities      | Requires `GEMINI_API_KEY`; deterministic fallback on failure  |
| POST     | `/api/matchmaking/hangout-plan`     | AI meetup agenda           | Same Gemini guardrails; returns agenda, prompts, follow-ups   |
| GET/POST | `/api/schedule/:userId`             | Fetch/save free-time slots | JSON-serialized schedule consumed by `useScheduleManager`     |
| Multiple | `/api/auth/*`, `/api/connections/*` | Auth and friend graph      | Supabase-backed when configured, stubbed otherwise            |

---

### Testing and Tooling

- `pnpm test` (backend) – Jest suites for auth, connections, matchmaking.
- `pnpm lint` (frontend) – ESLint plus TypeScript quality gate.
- `scripts/seedMatchmakingSample.js` – seeds demo data for matchmaking.
- `CODE_AUDIT.md` – documents privacy and security considerations.

---

### Configuration Cheatsheet

- `SUPABASE_USE_STUB=true` → use `supabaseStub.js`; configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to enable real Supabase.
- `GEMINI_API_KEY` (and optional `GEMINI_MODEL`) → enable AI suggestions and hangout planner; otherwise 501 responses with fallback messaging.
- `VITE_API_BASE_URL` (frontend) → points to backend (`http://localhost:4000` default).

---

### Hackathon Wins

- End-to-end matchmaking loop built and demo-ready in under 36 hours.
- Schedule-aware compatibility scoring with semantic clustering and trait highlights.
- Dual-mode AI assistance with guardrails and reliable fallbacks.
- Polished UX with high-frequency state sync, error messaging, and story-driven UI.
- Seamless switch between sample datasets and Supabase for flexible demos.

---

### Lessons Learned

- Shared sanitizers across frontend and backend prevented noisy inputs from skewing recommendations.
- Typed fetch layers plus explicit fallback messaging kept the UX resilient.
- AI integrations need operational guardrails (environment gating, payload trimming) before showtime.
- Early contract definitions minimized handoff friction between teammates.

---

### What’s Next

- Wire Supabase and Postgres migrations into a persistent matchmaking dataset.
- Productionize Gemini usage with observability, rate limits, and user consent flows.
- Expand group matchmaking into club or study pod formation via existing breakdowns.
- Add real-time notifications and richer connection workflows using inbox services.
- Mobile-friendly UI and accessibility refinements before a campus pilot.

---

Have fun exploring Interlink! Reach out if you want to extend the prototype or polish it post-hackathon.

## Interlink – Hackathon README

Welcome to **Interlink**, our commuter-student matchmaking and hangout-planning prototype built during the Hack SBU sprint. Interlink helps students find like-minded peers, align schedules in minutes, and spin up campus meetups—powered by smart data hygiene, AI-assisted planning, and a polished end-to-end experience.

---

### Why Interlink

- **Campus connection superpower**: commuters drop availability, interests, and courses to discover curated matches that feel human.
- **From match to meetup**: every connection includes shared availability highlights plus an instant AI-generated hangout plan with deterministic fallback.
- **Rapid iteration ready**: the stack runs locally, swaps between sample data and Supabase, and is instrumented for future growth.

---

### Architecture at a Glance

- **Frontend** – React + TypeScript + Vite SPA (`frontend/`)
  - Find Friend flow (`components/find-friend/`) with mode selector, schedule preview, matches list, and activity ideas.
  - Schedule builder using `react-big-calendar`, optimistic sync (`useScheduleManager`), conflict detection, and friendly alerts.
  - Authenticated pages (Dashboard, Friends, Hangout Planner, etc.) wrapped by a shared `AuthContext`.
- **Backend** – Express APIs (`backend/`)
  - Matchmaking domain (`matchmaking/`) handles schedule overlap math, semantic affinity scoring, group matchmaking, and debug logging.
  - AI services (`activitySuggestionService.js`) integrate Google Gemini with sanitizer guardrails and deterministic fallback content.
  - Auth, Connections, Inbox, and Schedule modules (Supabase-ready) with in-memory stores for hackathon agility.
- **Shared practices**
  - Bidirectional sanitizers (`sanitizeUser`, `sanitizeSeeker`, `sanitizeInstagram`) ensure consistent payload hygiene.
  - Structured errors (`MatchmakingApiError` mirror) and typed DTOs keep the UX resilient.
  - SQL migrations (`backend/db/migrations/`) lay groundwork for a Postgres schema.

---

### Feature Highlights

- 🧭 **Smart matchmaking** – compatibility breakdowns (schedule, affinity, hobbies, interests, major bonus) and cluster tagging for pairs and groups.
- 📅 **Schedule intelligence** – drag-and-drop free-time slots, overlap detection, auto-save hashing, and contextual messaging.
- 🤖 **AI hangout concierge** – Gemini-backed activity suggestions and hangout agendas with JSON prompts, fallbacks, and environment gating.
- 🔗 **Connections hub** – friend request APIs with swap-in persistence, mirrored by `connectionsApi.ts` and `FriendsPage.tsx`.
- 🧼 **Input sanitization everywhere** – Instagram normalization, string list trimming, payload dedupe, and safe defaults across the stack.

---

### Getting Started

#### Prerequisites

- Node.js 20+
- pnpm (or npm)
- Supabase + Google Gemini keys (optional; stubs available)

#### Quickstart

```bash
# Backend
cd backend
pnpm install
cp env.example .env          # configure SUPABASE_* or leave blank for stubs
pnpm run dev                 # default port :4000

# Frontend
cd ../frontend
pnpm install
cp env.example .env          # set VITE_API_BASE_URL if backend is not :4000
pnpm run dev                 # default port :5173
```

Visit `http://localhost:5173`. Stubbed auth instructions appear on the login screen. The Find Friend page seeds sample data and calls live matchmaking endpoints.

---

### Key API Endpoints

| Method   | Endpoint                            | Purpose                    | Notes                                                         |
| -------- | ----------------------------------- | -------------------------- | ------------------------------------------------------------- |
| POST     | `/api/matchmaking/matches`          | Generate match previews    | Requires `mode`, `slots`, optional seeker profile and filters |
| POST     | `/api/matchmaking/activity-ideas`   | AI-curated activities      | Requires `GEMINI_API_KEY`; deterministic fallback on failure  |
| POST     | `/api/matchmaking/hangout-plan`     | AI meetup agenda           | Same Gemini guardrails; returns agenda, prompts, follow-ups   |
| GET/POST | `/api/schedule/:userId`             | Fetch/save free-time slots | JSON-serialized schedule consumed by `useScheduleManager`     |
| Multiple | `/api/auth/*`, `/api/connections/*` | Auth and friend graph      | Supabase-backed when configured, stubbed otherwise            |

---

### Testing and Tooling

- `pnpm test` (backend) – Jest suites for auth, connections, matchmaking.
- `pnpm lint` (frontend) – ESLint plus TypeScript quality gate.
- `scripts/seedMatchmakingSample.js` – seeds demo data for matchmaking.
- `CODE_AUDIT.md` – documents privacy and security considerations.

---

### Configuration Cheatsheet

- `SUPABASE_USE_STUB=true` → use `supabaseStub.js`; configure `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` to enable real Supabase.
- `GEMINI_API_KEY` (and optional `GEMINI_MODEL`) → enable AI suggestions and hangout planner; otherwise 501 responses with fallback messaging.
- `VITE_API_BASE_URL` (frontend) → points to backend (`http://localhost:4000` default).

---

### Hackathon Wins

- End-to-end matchmaking loop built and demo-ready in under 36 hours.
- Schedule-aware compatibility scoring with semantic clustering and trait highlights.
- Dual-mode AI assistance with guardrails and reliable fallbacks.
- Polished UX with high-frequency state sync, error messaging, and story-driven UI.
- Seamless switch between sample datasets and Supabase for flexible demos.

---

### Lessons Learned

- Shared sanitizers across frontend and backend prevented noisy inputs from skewing recommendations.
- Typed fetch layers plus explicit fallback messaging kept the UX resilient.
- AI integrations need operational guardrails (environment gating, payload trimming) before showtime.
- Early contract definitions minimized handoff friction between teammates.

---

### What’s Next

- Wire Supabase and Postgres migrations into a persistent matchmaking dataset.
- Productionize Gemini usage with observability, rate limits, and user consent flows.
- Expand group matchmaking into club or study pod formation via existing breakdowns.
- Add real-time notifications and richer connection workflows using inbox services.
- Mobile-friendly UI and accessibility refinements before a campus pilot.

---

Have fun exploring Interlink! Reach out if you want to extend the prototype or polish it post-hackathon.
