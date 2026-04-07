---
name: sdd-do
description: "Route freeform text to the right SDD command automatically"
---

<cursor_skill_adapter>
## A. Skill Invocation
- This skill is invoked when the user mentions `sdd-do` or describes a task matching this skill.
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
Analyze freeform natural language input and dispatch to the most appropriate SDD command.

Acts as a smart dispatcher — never does the work itself. Matches intent to the best SDD command using routing rules, confirms the match, then hands off.

Use when you know what you want but don't know which `/sdd-*` command to run.
</objective>

<execution_context>
@C:/Users/DS_Chitteti Bhargav/OneDrive - Data Semantics Pvt Ltd/Work/SDD-Setup/sdd-cc/.cursor/sdd/workflows/do.md
@C:/Users/DS_Chitteti Bhargav/OneDrive - Data Semantics Pvt Ltd/Work/SDD-Setup/sdd-cc/.cursor/sdd/references/ui-brand.md
</execution_context>

<context>
{{SDD_ARGS}}
</context>

<process>
Execute the do workflow from @C:/Users/DS_Chitteti Bhargav/OneDrive - Data Semantics Pvt Ltd/Work/SDD-Setup/sdd-cc/.cursor/sdd/workflows/do.md end-to-end.
Route user intent to the best SDD command and invoke it.
</process>
