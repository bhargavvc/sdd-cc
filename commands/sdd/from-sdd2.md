---
name: sdd:from-sdd2
description: Import a SDD-2 (.sdd/) project back to SDD v1 (.planning/) format
argument-hint: "[--path <dir>] [--force]"
allowed-tools:
  - Read
  - Write
  - Bash
type: prompt
---

<objective>
Reverse-migrate a SDD-2 project (`.sdd/` directory) back to SDD v1 (`.planning/`) format.

Maps the SDD-2 hierarchy (Milestone → Slice → Task) to the SDD v1 hierarchy (Milestone sections in ROADMAP.md → Phase → Plan), preserving completion state, research files, and summaries.
</objective>

<process>

1. **Locate the .sdd/ directory** — check the current working directory (or `--path` argument):
   ```bash
   node "$HOME/.claude/sdd/bin/sdd-tools.cjs" from-sdd2 --dry-run
   ```
   If no `.sdd/` is found, report the error and stop.

2. **Show the dry-run preview** — present the full file list and migration statistics to the user. Ask for confirmation before writing anything.

3. **Run the migration** after confirmation:
   ```bash
   node "$HOME/.claude/sdd/bin/sdd-tools.cjs" from-sdd2
   ```
   Use `--force` if `.planning/` already exists and the user has confirmed overwrite.

4. **Report the result** — show the `filesWritten` count, `planningDir` path, and the preview summary.

</process>

<notes>
- The migration is non-destructive: `.sdd/` is never modified or removed.
- Pass `--path <dir>` to migrate a project at a different path than the current directory.
- Slices are numbered sequentially across all milestones (M001/S01 → phase 01, M001/S02 → phase 02, M002/S01 → phase 03, etc.).
- Tasks within each slice become plans (T01 → plan 01, T02 → plan 02, etc.).
- Completed slices and tasks carry their done state into ROADMAP.md checkboxes and SUMMARY.md files.
- SDD-2 cost/token ledger, database state, and VS Code extension state cannot be migrated.
</notes>
