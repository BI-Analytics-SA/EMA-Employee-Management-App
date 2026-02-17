# Plan: EMA-10 – Display Version Number in App Front End

**Beads:** EMA - Employee Management App-10 · **GitHub:** #15  
**Summary:** Show an app version in the front end so users know when to refresh and support can ask “what version do you see?” and get a clear answer. Use an automated, build-time source of truth (no manual editing).

---

## Goals

1. **User-facing version** — Display a version string somewhere in the UI (discoverable but not intrusive).
2. **Support** — When developers ask “what version are you on?”, the user can read it from the app.
3. **Refresh hint** — Users can correlate “new version” with “I should refresh” (e.g. after a deploy).
4. **Automation** — Version comes from a single source of truth at build time (e.g. `package.json`), so every build/deploy has the correct version without manual steps.

---

## Current state

- **package.json** ([package.json](package.json)): Has `"version": "0.1.0"`. This is the natural source of truth.
- **Build** — Vite build; no version is currently injected into the app bundle.
- **Layout** — Main app UI is in [AppShell](src/components/layout/AppShell.tsx) (Header + Sidebar + main content). [Header](src/components/layout/Header.tsx) has a user dropdown (avatar + name + org + Sign out). [Sidebar](src/components/layout/Sidebar.tsx) has logo, nav, and settings; no footer yet.
- **Env** — App already uses `import.meta.env.VITE_CONVEX_URL` ([App.tsx](src/App.tsx)); no `VITE_APP_VERSION` or similar today.

---

## Approach

### 1. Source of truth and build-time injection

- **Use `package.json` `version`** — No new version file; keep one place to bump (e.g. for releases).
- **Inject at build time** — In [vite.config.ts](vite.config.ts), read `package.json` and use Vite’s `define` to inject a global (e.g. `__APP_VERSION__`) so the built bundle contains the version string. No runtime config or env var required for version.
- **TypeScript** — Declare the injected global (e.g. in `src/vite-env.d.ts` or existing typings) so `APP_VERSION` (or the chosen name) is typed where used.

### 2. Where to show the version

- **Recommended: user dropdown in Header** — Add a line in the Header’s user dropdown (e.g. under the org name / above “Sign out”): e.g. “App version 0.1.0”. Benefits:
  - One place that works on mobile and desktop.
  - Easy to find when support asks (“click your name/avatar and look at the version”).
  - Does not clutter the main content or the sidebar nav.
- **Optional: Sidebar footer** — A small “v0.1.0” in the Sidebar footer (when expanded) for consistency; can be added later if desired. When sidebar is collapsed, version can be omitted or shown on logo hover/tooltip.

For scope of this plan, **implement the user-dropdown placement**; sidebar footer can be a follow-up.

### 3. Optional “refresh” hint

- A short line in the same dropdown (e.g. “Refresh the page to get the latest version”) is optional and improves the “when to refresh” use case. Can be added in the same change or later.

---

## Implementation steps (recommended order)

1. **Inject version in Vite**
   - In `vite.config.ts`, `import pkg from './package.json'` (or read with `readFileSync` + `JSON.parse` if needed for type/config).
   - Add to `define`: e.g. `__APP_VERSION__: JSON.stringify(pkg.version)`.
   - Ensure the build still runs and the value appears in the bundle (e.g. search built JS for the version string).

2. **Expose version to the app**
   - Add or update a type declaration (e.g. `src/vite-env.d.ts`) so the global used in `define` is declared (e.g. `declare const __APP_VERSION__: string`).
   - Optionally create a small constant module, e.g. `src/lib/version.ts`, that exports `export const APP_VERSION = __APP_VERSION__;` and use that everywhere, so the app only references the constant (keeps `define` usage in one place).

3. **Show version in the Header user dropdown**
   - In [Header.tsx](src/components/layout/Header.tsx), inside the dropdown (e.g. in the “User info” block or between it and “Sign out”), render the version, e.g. “App version {APP_VERSION}”.
   - Use muted, small text so it’s visible but secondary. Ensure it’s still readable and accessible (e.g. no need for a separate label if the line is clear).

4. **Optional**
   - Add a one-line “Refresh the page to get the latest version” in the dropdown.
   - Later: add version in Sidebar footer or logo tooltip when collapsed.

5. **Verify**
   - Run `npm run build` and confirm the built assets contain the current `package.json` version.
   - Load the app, open the user dropdown, and confirm the displayed version matches.
   - After changing `version` in `package.json` and rebuilding, confirm the UI shows the new value.

---

## Out of scope (for this plan)

- Backend/API version reporting.
- Changelog or “what’s new” UI.
- Automatic “new version available” prompt or service worker update UI (PWA already uses `registerType: 'autoUpdate'`; that can be enhanced separately if needed).

---

## Versioning: automated from conventional commits

The version in the UI comes from `package.json` → `version`. **Bumping is automated** via [semantic-release](https://github.com/semantic-release/semantic-release) and Conventional Commits; see `.cursor/rules/versioning-and-commits.mdc` and AGENTS.md.

### How version numbers increase (SemVer)

Use **Semantic Versioning** `MAJOR.MINOR.PATCH` (e.g. `0.1.0` → `0.1.1` → `0.2.0` → `1.0.0`):

| Part    | When to bump | Example |
|--------|----------------|--------|
| **PATCH** | Bug fixes, small tweaks, no new features or breaking changes | `0.1.0` → `0.1.1` |
| **MINOR** | New features or improvements, no breaking changes | `0.1.1` → `0.2.0` |
| **MAJOR** | Breaking changes (e.g. data model, auth, or behaviour users rely on) | `0.2.0` → `1.0.0` |

While the app is pre-1.0, you can treat `0.x.y` as “still evolving”; MINOR can mean “notable release” and PATCH “small fix” if that’s easier.

**How to bump:** Edit `package.json` and change the `"version"` string, then commit. Example: `"0.1.0"` → `"0.1.1"`. No script is required; the next build will show the new version in the UI.

### When the version changes (automation)

- **Trigger:** Push to `main`. The GitHub Action (`.github/workflows/release.yml`) runs `semantic-release`.
- **Behaviour:** semantic-release looks at commits since the last tag. If there is at least one `fix:` or `feat:` (or breaking), it computes the next version, updates `package.json`, commits the change, and creates a git tag (e.g. `v0.1.1`). It does **not** publish to npm (`npmPublish: false`; app is private). **Option A (recommended):** Bump when you **release to production** (e.g. when you merge to `main` and deploy, or when you cut a release). Each production deploy has a new version so support can say “upgrade to 0.1.2” and users see a clear number.
- **Option B:** Bump on every deploy (including previews). Then every build has a unique version; you may want to add a suffix for non-production (e.g. `0.1.1-preview.3`) so production stays clean.
- **Option C:** Bump only for “named” releases (e.g. end of sprint or when you announce to users). Fewer version numbers; less granular for support.

For EMA, **Option A** is a good default: bump PATCH for small fixes and MINOR for feature releases when you deploy to production, and keep the version in `package.json` as the single source of truth.

**Automation:** Bumping is now automated via **semantic-release** and **Conventional Commits**. Commit messages determine the bump: `fix:` → PATCH, `feat:` → MINOR, `BREAKING CHANGE:` or `feat!:` → MAJOR. On push to `main`, the GitHub Action (`.github/workflows/release.yml`) runs semantic-release, which updates `package.json`, commits, and creates a tag (e.g. `v0.1.1`). Netlify then builds that commit. No Convex or Netlify config is needed for versioning. See `.cursor/rules/versioning-and-commits.mdc` and AGENTS.md.

---

## References

- Beads issue: **EMA - Employee Management App-10**
- GitHub: **#15**
- Vite `define`: https://vite.dev/config/shared-options.html#define
- Current app version: `package.json` → `"version": "0.1.0"`
- Semantic Versioning: https://semver.org/
- semantic-release: https://github.com/semantic-release/semantic-release
- Conventional Commits: https://www.conventionalcommits.org/
