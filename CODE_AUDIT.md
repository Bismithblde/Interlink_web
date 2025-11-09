# Interlink Web Code Audit

## Snapshot
- Reviewed: backend auth service and frontend React app (`frontend/src`, `backend/auth`, `backend/index.js`)
- Focus: inefficient or risky practices that currently work but should be improved
- Date: 2025-11-08

## High-Priority Findings

**Store only the minimum session data and keep access tokens out of `localStorage`.**

```39:52:frontend/src/pages/LoginPage.tsx
  const persistSession = (
    authResponse: SignInResponse,
    profile: SupabaseProfileResponse["user"]
  ) => {
    if (typeof window === "undefined") return;

    const storagePayload = {
      user: profile ?? authResponse.user ?? null,
      session: authResponse.session ?? null,
      storedAt: new Date().toISOString(),
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storagePayload));
  };
```
```79:92:frontend/src/services/authApi.ts
  async signUp({ email, password }: SignupPayload) {
    return request<{ user: SupabaseUser | null }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
```
- Impact: `persistSession` writes the full Supabase session (including `access_token` and `refresh_token`) into `localStorage`. This is vulnerable to XSS, survives indefinitely, and is never read back anywhere else in the codebase (so it only increases attack surface).
- Recommendation: Remove the extra session store entirely or replace it with an HttpOnly cookie flow. If persistence is required, store only the minimal user identifier in memory via `AuthContext` and rely on refresh endpoints to mint new tokens.

**Match collected signup data with what the API actually sends.**

```37:44:frontend/src/pages/SignupPage.tsx
      const signupPayload: SignupPayload = {
        name: fullName,
        email,
        password,
      };

      await authApi.signUp(signupPayload);
```
```79:92:frontend/src/services/authApi.ts
  async signUp({ email, password }: SignupPayload) {
    return request<{ user: SupabaseUser | null }>("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },
```
- Impact: The UI collects `name` (and `SignupPayload` allows other profile fields) but `authApi.signUp` strips everything except `email` and `password`. Users will believe their name is saved when it never leaves the browser.
- Recommendation: Either send the additional fields to the backend (and persist them) or simplify the UI/types so only the credentials that are actually used are collected.

**Avoid a round-trip to Supabase on every protected request.**

```30:44:backend/auth/middleware/authMiddleware.js
    if (supabase.auth && supabase.auth.getUser) {
      // v2: getUser(token)
      const { data, error } = await supabase.auth.getUser(token);
      if (error) throw error;
      req.user = data.user || data;
      debug('Supabase token verification succeeded', {
        userId: req.user?.id,
        email: req.user?.email,
      });
      return next();
    }

    // If supabase client doesn't provide getUser, try decoding token server-side (not implemented here)
    debug('Supabase client does not expose auth.getUser; cannot verify token with current client version');
    return res.status(501).json({ error: 'Token verification not implemented for this client' });
```
- Impact: Every protected call performs a network request back to Supabase. Latency compounds quickly and the handler cannot function if Supabase has transient issues.
- Recommendation: Cache the Supabase JWKS and verify JWTs locally (see Supabase's [GoTrue docs](https://supabase.com/docs/guides/auth/server-side/jwks)). Keep the admin client only for mutations that need elevated privileges.

## Medium Priority

**Clean up timers created inside React components.**

```97:107:frontend/src/pages/LoginPage.tsx
      setSuccessMessage(`Welcome back, ${welcomeName}! Redirecting you now…`);

      setTimeout(() => {
        navigate("/");
      }, 800);
```
```44:53:frontend/src/pages/SurveyPage.tsx
    setTimeout(() => {
      setSuccessMessage(
        "Thanks! Your profile survey is saved. We’ll take you to your profile."
      );
      setIsSubmitting(false);
      setTimeout(() => navigate("/profile"), 1200);
    }, 600);
```
- Impact: If either page unmounts before the timers fire (navigation, rapid re-entry, fast refresh), `setState` will run on an unmounted component. This logs warnings in strict mode and leaks timers.
- Recommendation: Capture timeout IDs in refs and clear them in a cleanup effect (or replace with `useEffect`-managed timers such as `useTimeout` from `@react-hookz/web`).

**Harden `AuthContext` against malformed storage events.**

```49:57:frontend/src/context/AuthContext.tsx
  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key !== STORAGE_KEY) return;
      setUser(event.newValue ? JSON.parse(event.newValue) : null);
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);
```
- Impact: A malformed or manually edited value in `localStorage` will throw during `JSON.parse`, crashing the tab.
- Recommendation: Wrap parses in `try/catch` and ignore invalid entries rather than taking down the app.

**Throttle heavy `localStorage` writes triggered by drag operations.**

```115:121:frontend/src/pages/SchedulePage.tsx
  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify(serializeSlots(freeTimeSlots))
    );
  }, [freeTimeSlots]);
```
- Impact: `react-big-calendar` emits frequent updates while events are dragged/resized. Synchronous `localStorage.setItem` calls during drag can introduce noticeable jank.
- Recommendation: Debounce the persistence (e.g., `requestIdleCallback`, `setTimeout`, or a `useDebouncedValue`) or persist only on drag end.

**Memoize derived JSON used solely for diagnostics.**

```371:377:frontend/src/pages/SchedulePage.tsx
              <div className="rounded-2xl border border-sky-100 bg-white/70 p-4">
                <div className="text-xs font-semibold uppercase tracking-[0.3em] text-sky-400">
                  Data Structure
                </div>
                <pre className="mt-2 max-h-40 overflow-auto rounded-xl bg-slate-900/90 p-3 font-mono text-xs leading-5 text-sky-100">
                  {JSON.stringify(serializeSlots(freeTimeSlots), null, 2)}
                </pre>
              </div>
```
- Impact: Rendering re-serializes the entire schedule on every React commit, even when the preview is off-screen. This is minor today but grows with slot count.
- Recommendation: Memoize the pretty-printed JSON (e.g., `useMemo`) or gate it behind a debug toggle.

## Suggested Next Steps
- Prioritize eliminating session token storage from `localStorage` and move the app to a cookie-based or short-lived in-memory session.
- Align the signup flow with the data contract so collected profile data is not silently dropped.
- Introduce defensive coding patterns (cleanup timers, try/catch on storage events) to avoid warning storms during development.
- Rework token verification to rely on cached JWKS to improve latency and resilience.
- Consider adding automated checks (lint rules or custom ESLint plugin) that flag direct `localStorage` writes inside render/effect hooks without throttling to prevent regressions.


