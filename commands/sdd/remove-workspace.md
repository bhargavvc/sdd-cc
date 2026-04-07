---
name: sdd:remove-workspace
description: Remove a SDD workspace and clean up worktrees
argument-hint: "<workspace-name>"
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
---
<context>
**Arguments:**
- `<workspace-name>` (required) — Name of the workspace to remove
</context>

<objective>
Remove a workspace directory after confirmation. For worktree strategy, runs `git worktree remove` for each member repo first. Refuses if any repo has uncommitted changes.
</objective>

<execution_context>
@~/.claude/sdd/workflows/remove-workspace.md
@~/.claude/sdd/references/ui-brand.md
</execution_context>

<process>
Execute the remove-workspace workflow from @~/.claude/sdd/workflows/remove-workspace.md end-to-end.
</process>
