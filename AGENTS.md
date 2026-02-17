# Agent instructions

When working in this repo, follow the project’s Cursor rules.

## Must follow

- **Issue / task work**  
  Use the **Beads workflow** from `.cursor/rules/beads.mdc`:
  - Discover work with `bd ready` or `bd list --status=open`.
  - Claim work with `bd update <id> --status=in_progress`.
  - Mark complete with `bd close <id>` — **do not** edit `.beads/issues.jsonl` by hand.
  - Sync with `bd sync` when appropriate (or rely on git hooks).

- **Other rules**  
  Apply any rules in `.cursor/rules/` that match the current task or open files (e.g. UI layout patterns when editing `.tsx`).

## Reference

- Beads workflow: `.cursor/rules/beads.mdc`
- Full Beads context: run `bd prime`
- Design: `DESIGN_SPEC.md`
