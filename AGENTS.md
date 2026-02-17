# Agent instructions

When working in this repo, follow the project’s Cursor rules.

## Must follow

- **Issue / task work**  
  Use the **Beads workflow** from `.cursor/rules/beads.mdc`:
  - Discover work with `bd ready` or `bd list --status=open`.
  - Claim work with `bd update <id> --status=in_progress`.
  - Mark complete with `bd close <id>` — **do not** edit `.beads/issues.jsonl` by hand.
  - Sync with `bd sync` when appropriate (or rely on git hooks).

- **Versioning and commits**  
  Use **Conventional Commits** so automated versioning works (see `.cursor/rules/versioning-and-commits.mdc`):
  - `fix:` or `fix(scope):` → PATCH bump (e.g. 0.1.0 → 0.1.1).
  - `feat:` or `feat(scope):` → MINOR bump (e.g. 0.1.1 → 0.2.0).
  - `BREAKING CHANGE:` or `feat!:` / `fix!:` → MAJOR bump.
  - **Prefixes MUST be lowercase** — `fix:` not `Fix:`, `feat:` not `Feat:` or `Feature:`.
  - **A colon is required** after the type: `feat: add X` not `feat add X`.
  - Version is bumped automatically on push to `main` by semantic-release (GitHub Actions); no manual edits to `package.json` version for releases.

- **Other rules**  
  Apply any rules in `.cursor/rules/` that match the current task or open files (e.g. UI layout patterns when editing `.tsx`).

## Reference

- Beads workflow: `.cursor/rules/beads.mdc`
- Versioning and commits: `.cursor/rules/versioning-and-commits.mdc`
- Full Beads context: run `bd prime`
- Design: `DESIGN_SPEC.md`
