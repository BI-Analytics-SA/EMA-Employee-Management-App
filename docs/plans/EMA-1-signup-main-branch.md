# Plan: EMA-1 – Main Branch Sign Up Bug

**Beads:** EMA - Employee Management App-1 · **GitHub:** #12  
**Summary:** Can't sign up on Main; check new URL etc.

---

## Problem

Sign-up does not work on the **main** (production) deployment. The app uses two Convex deployments (dev vs prod) and Netlify branch deploys; production uses a different Convex deployment and may use a new domain (Pepl.co.za per issue #7).

---

## Root cause areas

1. **Convex production env vars**  
   Auth and invite links depend on Convex backend env. If production Convex is missing or wrong, sign-up breaks.

2. **Auth domain (`CONVEX_SITE_URL`)**  
   `convex/auth.config.ts` uses `process.env.CONVEX_SITE_URL`. For **production** Convex this must be the **production** Convex site URL (e.g. `https://energized-squirrel-967.convex.site`), not dev.

3. **Frontend Convex URLs on main**  
   Netlify **production** build must use production Convex:
   - `VITE_CONVEX_URL` = `https://energized-squirrel-967.convex.cloud`
   - `VITE_CONVEX_SITE_URL` = `https://energized-squirrel-967.convex.site`  
   If main uses dev URLs, the app would talk to dev backend from a prod URL and auth can fail or redirect incorrectly.

4. **Invite link base URL (`SITE_URL`)**  
   `convex/invites/actions.ts` uses `process.env.SITE_URL || "http://localhost:5173"` for invite links in emails. In **production** Convex, `SITE_URL` must be the real production app URL (e.g. `https://app.pepl.co.za` or current main URL). Wrong or missing `SITE_URL` sends users to localhost or wrong domain.

5. **Allowed redirect / origin (Convex Auth)**  
   Convex Auth validates redirect/origin. If the production app URL (or new Pepl.co.za URL) is not allowed, sign-up/sign-in redirects can be rejected.

6. **New production URL (Pepl.co.za)**  
   Issue #7 is to update production Netlify URL to Pepl.co.za. Until that domain is added to Convex Auth and Convex env (e.g. `SITE_URL`), sign-up on the new URL may fail.

---

## Verification checklist

### 1. Convex production deployment

- [ ] In [Convex Dashboard](https://dashboard.convex.dev) select **production** deployment (e.g. `energized-squirrel-967`).
- [ ] **Settings → Environment variables** (or equivalent):
  - [ ] `CONVEX_SITE_URL` = `https://energized-squirrel-967.convex.site` (or your prod Convex site URL).
  - [ ] `SITE_URL` = production app URL (e.g. `https://app.pepl.co.za` or current main Netlify URL). No trailing slash.

### 2. Netlify production (main branch)

- [ ] **Site settings → Environment variables** for **Production** (or branch `main`):
  - [ ] `VITE_CONVEX_URL` = `https://energized-squirrel-967.convex.cloud`
  - [ ] `VITE_CONVEX_SITE_URL` = `https://energized-squirrel-967.convex.site`
- [ ] Redeploy main after any env change.

### 3. Convex Auth redirect / origin

- [ ] In Convex Auth docs/dashboard, confirm allowed redirect/origin list includes the exact production app URL (and, when applicable, Pepl.co.za).
- [ ] If using a new domain (Pepl.co.za), add it before or as part of the Netlify URL change (#7).

### 4. Reproduce and test

- [ ] Open production app in incognito (exact main URL).
- [ ] Sign up with a new email; confirm no redirect errors or “invalid redirect” messages.
- [ ] If invite flow is used: create invite, open email link, confirm link points to production URL and sign-up completes.

---

## Implementation steps (recommended order)

1. **Verify and set Convex production env**
   - Set `CONVEX_SITE_URL` and `SITE_URL` for production Convex; redeploy Convex if needed.
2. **Verify Netlify production env**
   - Ensure main uses production Convex URLs; trigger a new deploy.
3. **Verify Convex Auth allowlist**
   - Add production (and Pepl.co.za if live) to allowed redirect/origin.
4. **Test sign-up on main**
   - Full sign-up and, if used, invite flow on production URL.
5. **Coordinate with #7 (Update production Netlify URL)**
   - When switching to Pepl.co.za, update `SITE_URL` and Auth allowlist for the new domain and re-test sign-up.

---

## References

- `convex/auth.config.ts` – auth domain
- `convex/invites/actions.ts` – invite link base URL
- `DEPLOYMENT.md` – dev vs prod Convex URLs and Netlify setup
- GitHub #7 – Update production Netlify URL (Pepl.co.za)
