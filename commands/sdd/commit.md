---
name: sdd:commit
description: Stage and commit current changes interactively with a conventional commit message.
argument-hint: "[<commit message> | --all]"
allowed-tools:
  - Bash
  - Read
  - AskUserQuestion
---

<objective>
Interactive git commit for the working tree. Surveys what is changed, suggests a conventional
commit message based on the diff, asks the user to confirm, then stages the selected files and
commits.

This is the fork-added counterpart to the auto-commit step that was stripped from `/sdd:fast`.
Use it after any task — `/sdd:fast`, `/sdd:quick`, manual edits, anything — when you are ready
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
step. If they passed `--all`, stage every tracked modification AND every untracked file (still
asks for a final confirmation). Otherwise, run the full interactive flow.

Set TEXT_MODE=true when `--text` is present in $ARGUMENTS or when `workflow.text_mode` is true.
In TEXT_MODE every AskUserQuestion call is replaced with a plain-text numbered list and the user
is asked to type their choice.
</process>
