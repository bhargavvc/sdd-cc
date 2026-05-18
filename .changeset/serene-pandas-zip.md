---
type: Fixed
pr: 3516
---
**`/sdd-update --reapply` no longer treats installer-authored commits as user customizations** — the git-enhanced two-way merge filter in `sdd/workflows/reapply-patches.md` was missing the `sdd-update` arm after the slash-command rename from `/sdd:update` to `/sdd-update`. Commits created by the current update flow no longer fall through; they now match the exclusion filter and are excluded from the diff, preventing spurious merge-conflict prompts. The legacy `sdd:update` arm is preserved for back-compat, and `SDD update` / `sdd-install` exclusions are unchanged. (#3516)
