# Production release checklist

Use this checklist before and after pushing to production (merge/push to `main`).

---

## Before pushing to production

### Code & quality

- [ ] **All work complete** – Feature/fix is done; no half-finished changes in the branch.
- [ ] **Lint passes** – `npm run lint` (or your lint script) passes with no errors.
- [ ] **TypeScript clean** – `npx tsc --noEmit` (or `npm run build`) succeeds with no type errors.
- [ ] **Tests pass** – Run the project test suite; fix or skip only with good reason.
- [ ] **No debug code** – Remove or guard `console.log`, debugger statements, and temporary test data.

### Commits & versioning

- [ ] **Conventional Commits** – Every commit that should trigger a release uses the correct prefix:
  - `fix:` or `fix(scope):` → PATCH
  - `feat:` or `feat(scope):` → MINOR
  - `BREAKING CHANGE:` in body or `feat!:` / `fix!:` → MAJOR
- [ ] **Prefix format** – Lowercase type, colon after type (e.g. `feat: add X`), present tense.
- [ ] **No manual version bump** – Do not edit `package.json` version; semantic-release does it on push to `main`.

### Convex

- [ ] **Schema valid** – `npx convex codegen` (or `npx convex dev`) runs without schema errors.
- [ ] **Migrations / backfills** – If you added optional fields or one-time updates (e.g. backfill bank defaults), either:
  - Document that an admin must run the backfill after deploy, or
  - Plan to run it once from the app (e.g. Export Config “Set default bank fields”) or Convex dashboard after release.

### Configuration & secrets

- [ ] **Env and secrets** – Production Convex project and Netlify (if used) have correct env vars and secrets (e.g. `NETLIFY_BUILD_HOOK_URL` for the release workflow).
- [ ] **No secrets in code** – No API keys, passwords, or tokens committed; use Convex env or Netlify env.

### Issue tracking (Beads)

- [ ] **Issues closed** – All work for this release is closed in Beads (`bd close <id>`).
- [ ] **Sync before push** – Run `bd sync` so remote has up-to-date issue state (or rely on git hooks if configured).

### Final checks

- [ ] **Branch up to date** – Rebase or merge from `main` so you’re not pushing stale code.
- [ ] **Sensitive data** – No real PII, bank details, or credentials in logs, fixtures, or docs.
- [ ] **Docs/plans** – If the change is user-facing or config-related, update or add docs/plans as needed.

---

## After pushing to production

### Deployment

- [ ] **GitHub Actions** – Release workflow (semantic-release) completes successfully on the push to `main`.
- [ ] **Version bump** – A new tag (e.g. `v0.2.1`) and a commit that updates `package.json` version appear on `main`.
- [ ] **Netlify build** – Build hook ran and the latest production deploy succeeded (check Netlify dashboard).
- [ ] **Convex** – Production Convex project is on the latest deployment; no failed deploys in Convex dashboard.

### Verification

- [ ] **App loads** – Production URL loads and shows the expected app (no blank screen or runtime errors).
- [ ] **Auth** – Sign-in (and sign-out if applicable) works.
- [ ] **Critical paths** – At least: list employees, view/edit one employee, and one main feature you changed (e.g. bank details, export, reports).
- [ ] **Version in UI** – If the app displays version (e.g. in header/footer), it matches the new release version.

### One-time / follow-up tasks

- [ ] **Backfills or migrations** – If this release introduced a backfill (e.g. bank defaults), run it once for each org that needs it (via in-app action or Convex dashboard).
- [ ] **Feature flags / modules** – If you added a new module or flag, enable it for the right orgs or document how to enable it.

### Communication & tracking

- [ ] **Beads sync** – Run `bd sync` so issue state is synced after release.
- [ ] **Notify if needed** – If the release is high-impact or breaking, notify users or stakeholders per your process.
- [ ] **Monitor** – After deploy, watch Convex logs and Netlify (or your host) for errors or failed requests for a short period.

---

## Quick reference

| Step                    | Command / action                          |
|-------------------------|-------------------------------------------|
| Lint                    | `npm run lint`                            |
| Type-check / build      | `npm run build` or `npx tsc --noEmit`     |
| Convex schema           | `npx convex codegen` or `npx convex dev` |
| Beads sync              | `bd sync`                                 |
| Commit (release)        | `fix: message` or `feat: message`         |
| After push              | Check GitHub Actions → Netlify → Convex   |

---

*Last updated: 2025. Adjust items to match your team’s process (e.g. PR review, staging deploy, rollback steps).*
