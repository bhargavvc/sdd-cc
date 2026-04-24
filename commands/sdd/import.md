---
name: sdd:import
description: Ingest external plans with conflict detection against project decisions before writing anything.
argument-hint: "--from <filepath>"
allowed-tools:
  - Read
  - Write
  - Edit
  - Bash
  - Glob
  - Grep
  - AskUserQuestion
  - Task
---

<objective>
Import external plan files into the SDD planning system with conflict detection against PROJECT.md decisions.

- **--from**: Import an external plan file, detect conflicts, write as SDD PLAN.md, validate via sdd-plan-checker.

Future: `--prd` mode for PRD extraction is planned for a follow-up PR.
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
Execute the import workflow end-to-end.
</process>
