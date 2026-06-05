---
name: sdd:commit
description: Manually commit current changes with a conventional-commit message — interactive, never uses `git add -A` without confirmation.
argument-hint: "[<commit message> | --all]"
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
---

<objective>
Interactive git commit for the working tree. Surveys what's changed, suggests a conventional commit
message based on the diff, asks the user to confirm, then stages the selected files and commits.

This is the fork-added counterpart to the auto-commit step that was stripped from /sdd-fast.
Use it after any task — `/sdd-fast`, `/sdd-quick`, manual edits, anything — when you're ready
to checkpoint work without invoking a full phase workflow.

**Never auto-stages with `git add -A` or `git add .` without explicit user consent** — those
can sweep up `.env`, secrets, or build artifacts.
</objective>

<execution_context>
@~/.claude/sdd/workflows/commit.md
</execution_context>

<process>
Execute the workflow end-to-end.

If the user passed a message as the first argument, use it verbatim and skip the message-suggestion
step. If they passed `--all`, stage every tracked modification AND untracked file (still asks for
confirmation). Otherwise, run the full interactive flow.
</process>
