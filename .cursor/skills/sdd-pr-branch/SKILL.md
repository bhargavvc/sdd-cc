---
name: sdd-pr-branch
description: "Create a clean PR branch by filtering out .planning/ commits — ready for code review"
---

<cursor_skill_adapter>
## A. Skill Invocation
- This skill is invoked when the user mentions `sdd-pr-branch` or describes a task matching this skill.
- Treat all user text after the skill mention as `{{SDD_ARGS}}`.
- If no arguments are present, treat `{{SDD_ARGS}}` as empty.

## B. User Prompting
When the workflow needs user input, prompt the user conversationally:
- Present options as a numbered list in your response text
- Ask the user to reply with their choice
- For multi-select, ask for comma-separated numbers

## C. Tool Usage
Use these Cursor tools when executing SDD workflows:
- `Shell` for running commands (terminal operations)
- `StrReplace` for editing existing files
- `Read`, `Write`, `Glob`, `Grep`, `Task`, `WebSearch`, `WebFetch`, `TodoWrite` as needed

## D. Subagent Spawning
When the workflow needs to spawn a subagent:
- Use `Task(subagent_type="generalPurpose", ...)`
- The `model` parameter maps to Cursor's model options (e.g., "fast")
</cursor_skill_adapter>

<objective>
Create a clean branch suitable for pull requests by filtering out .planning/ commits
from the current branch. Reviewers see only code changes, not SDD planning artifacts.

This solves the problem of PR diffs being cluttered with PLAN.md, SUMMARY.md, STATE.md
changes that are irrelevant to code review.
</objective>

<execution_context>
@C:/Users/DS_Chitteti Bhargav/OneDrive - Data Semantics Pvt Ltd/Work/SDD-Setup/sdd-cc/.cursor/sdd/workflows/pr-branch.md
</execution_context>

<process>
Execute the pr-branch workflow from @C:/Users/DS_Chitteti Bhargav/OneDrive - Data Semantics Pvt Ltd/Work/SDD-Setup/sdd-cc/.cursor/sdd/workflows/pr-branch.md end-to-end.
</process>
