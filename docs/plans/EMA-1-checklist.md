# EMA-1 Sign-up fix – Working checklist

Work through each section. Check off when done and note any issues.

---

## 1. Convex production deployment

**Where:** [Convex Dashboard](https://dashboard.convex.dev) → switch to **production** deployment (e.g. `energized-squirrel-967`).

**Note:** `CONVEX_SITE_URL` is a **system** variable — Convex sets it automatically per deployment (e.g. `https://energized-squirrel-967.convex.site`). You do **not** need to add it manually.

- [ ] **1.1** Open **Deployment Settings** (or **Settings** → **Environment variables**) for the **production** deployment.
- [ ] **1.2** Confirm **SITE_URL** exists and equals your **production app URL** (no trailing slash).
  - Current main site: _______________ (e.g. `https://your-site.netlify.app` or `https://app.pepl.co.za`)
  - If missing or wrong: add/update **SITE_URL** to that URL.
- [ ] **1.3** If you changed env: redeploy Convex production if your platform requires it (Convex often picks up env changes without redeploy).

**Checked from repo:** Your **dev** deployment (`resilient-lemming-288`) has `SITE_URL=http://localhost:5173` — correct for local. **Production** (`energized-squirrel-967`) must have `SITE_URL` set to your live main URL in the dashboard (see 1.2).

**Result:** SITE_URL = _______________________

---

## 2. Netlify production (main branch)

**Where:** Netlify Dashboard → your site → **Site configuration** → **Environment variables** (or **Site settings** → **Environment variables**).

- [ ] **2.1** Ensure context is **Production** (or scope to branch **main**).
- [ ] **2.2** **VITE_CONVEX_URL** = `https://energized-squirrel-967.convex.cloud`
- [ ] **2.3** **VITE_CONVEX_SITE_URL** = `https://energized-squirrel-967.convex.site`
- [ ] **2.4** If you added or changed any variable: **Trigger a new deploy** of the **main** branch (e.g. **Deploys** → **Trigger deploy** → **Deploy site** or push a small commit).

**Result:** Main branch build uses production Convex: Yes / No

---

## 3. Convex Auth redirect / origin

**Where:** Convex Auth is configured via `convex/auth.config.ts` (domain = `CONVEX_SITE_URL`, which is automatic). For **password** auth, redirect is usually to the same origin as the frontend. If sign-up fails with “redirect” or “origin” errors:

- [ ] **3.1** Check [Convex Auth production docs](https://labs.convex.dev/auth/production) for your auth method (e.g. password, OAuth).
- [ ] **3.2** If there is an allowed-origins or redirect allowlist in the Convex dashboard or Auth config, add your **exact production app URL** (and, when live, `https://app.pepl.co.za` or your Pepl domain).
- [ ] **3.3** Note: With password auth, the frontend posts to Convex from the browser; the main issue is usually **wrong Convex deployment** (step 2) or **wrong SITE_URL** (step 1), not a separate redirect allowlist.

**Result:** No redirect/origin allowlist needed / Updated allowlist: _______________

---

## 4. Test sign-up on main

- [ ] **4.1** Open your **production** app URL in an **incognito/private** window.
- [ ] **4.2** Go to sign-up (e.g. **Sign up** link on login page).
- [ ] **4.3** Sign up with a **new** email; complete any verification if applicable.
- [ ] **4.4** Confirm: no “invalid redirect”, “origin not allowed”, or other auth errors; you land in the app or onboarding.
- [ ] **4.5** (Optional) If you use **invite emails**: create an invite, open the link from email, confirm the link uses the **production** URL and sign-up completes.

**Result:** Sign-up works: Yes / No. If No: _______________________

---

## Summary

| Step | Done | Notes |
|------|------|--------|
| 1. Convex SITE_URL | | |
| 2. Netlify prod env | | |
| 3. Auth allowlist | | |
| 4. Test sign-up | | |

When all are done, run `bd close "EMA - Employee Management App-1"` and sync.
