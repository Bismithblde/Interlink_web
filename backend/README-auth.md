Auth backend structure (Supabase + Postgres)

Files created:

- `auth/routes.js` — Express routes for /auth endpoints.
- `auth/controllers/authController.js` — Controllers: signUp, signIn, getProfile.
- `auth/services/supabaseClient.js` — Supabase server client wrapper (uses SUPABASE_SERVICE_ROLE_KEY).
- `auth/middleware/authMiddleware.js` — Example middleware to verify Bearer tokens.
- `auth/models/userModel.js` — Minimal Postgres helper functions.
- `db/index.js` — Postgres pool using config or env.
- `config/index.js` — Centralized config loaded from .env.
- `.env.example` — Example env variables for Supabase and Postgres.

Next steps:

1. Copy `.env.example` to `.env` and fill with your Supabase project values and Postgres creds.
2. Install new dependencies in the `backend` folder:

   npm install dotenv @supabase/supabase-js

3. If you want full Supabase admin APIs, ensure you use the service role key (keep it secret).
4. Create a `users` table in Postgres if you plan to use the fallback PG flows.

This scaffold is intentionally minimal — adapt controller calls to the exact version of `@supabase/supabase-js` you install.
