---
name: sdd-secure-phase
description: "Retroactively verify threat mitigations for a completed phase"
---

<cursor_skill_adapter>
## A. Skill Invocation
- This skill is invoked when the user mentions `sdd-secure-phase` or describes a task matching this skill.
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
Verify threat mitigations for a completed phase. Three states:
- (A) SECURITY.md exists — audit and verify mitigations
- (B) No SECURITY.md, PLAN.md with threat model exists — run from artifacts
- (C) Phase not executed — exit with guidance

Output: updated SECURITY.md.
</objective>

<execution_context>
@C:/Users/DS_Chitteti Bhargav/OneDrive - Data Semantics Pvt Ltd/Work/SDD-Setup/sdd-cc/.cursor/sdd/workflows/secure-phase.md
</execution_context>

<context>
Phase: {{SDD_ARGS}} — optional, defaults to last completed phase.
</context>

<process>
Execute @C:/Users/DS_Chitteti Bhargav/OneDrive - Data Semantics Pvt Ltd/Work/SDD-Setup/sdd-cc/.cursor/sdd/workflows/secure-phase.md.
Preserve all workflow gates.
</process>
