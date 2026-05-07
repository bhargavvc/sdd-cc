---
name: sdd:import
description: Ingest external plans with conflict detection against project decisions before writing anything.
argument-hint: "--from <filepath> | --from-gsd2"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - Agent
---

<objective>
Import external plan files into the SDD planning system with conflict detection against PROJECT.md decisions.

- **--from**: Import an external plan file, detect conflicts, write as SDD PLAN.md, validate via sdd-plan-checker.
- **--from-gsd2**: Reverse-migrate a SDD-2 project (`.sdd/` directory) back to SDD v1 (`.planning/`) format. Runs `sdd-tools.cjs from-gsd2`. Pass `--path <dir>` to migrate a project at a different path.
</objective>

<execution_context>
@~/.claude/sdd/workflows/import.md
@~/.claude/sdd/references/ui-brand.md
@~/.claude/sdd/references/gate-prompts.md
@~/.claude/sdd/references/doc-conflict-engine.md
</execution_context>

<context>
$ARGUMENTS
</context>

<process>
If `--from-gsd2` is in $ARGUMENTS:
Run: `node "$HOME/.claude/sdd/bin/sdd-tools.cjs" from-gsd2`
Pass `--path <dir>` if provided. Present the migration result to the user.
Stop here (do not run the standard import workflow).

Otherwise, execute the import workflow end-to-end.
</process>
