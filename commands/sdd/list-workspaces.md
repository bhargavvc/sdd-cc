---
name: sdd:list-workspaces
description: List active SDD workspaces and their status
allowed-tools:
  - Bash
  - Read
---
<objective>
Scan `~/sdd-workspaces/` for workspace directories containing `WORKSPACE.md` manifests. Display a summary table with name, path, repo count, strategy, and SDD project status.
</objective>

<execution_context>
@~/.claude/sdd/workflows/list-workspaces.md
@~/.claude/sdd/references/ui-brand.md
</execution_context>

<process>
Execute the list-workspaces workflow from @~/.claude/sdd/workflows/list-workspaces.md end-to-end.
</process>
