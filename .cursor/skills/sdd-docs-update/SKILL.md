---
name: sdd-docs-update
description: "Generate or update project documentation verified against the codebase"
---

<cursor_skill_adapter>
## A. Skill Invocation
- This skill is invoked when the user mentions `sdd-docs-update` or describes a task matching this skill.
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
Generate and update up to 9 documentation files for the current project. Each doc type is written by a sdd-doc-writer subagent that explores the codebase directly — no hallucinated paths, phantom endpoints, or stale signatures.

Flag handling rule:
- The optional flags documented below are available behaviors, not implied active behaviors
- A flag is active only when its literal token appears in `{{SDD_ARGS}}`
- If a documented flag is absent from `{{SDD_ARGS}}`, treat it as inactive
- `--force`: skip preservation prompts, regenerate all docs regardless of existing content or SDD markers
- `--verify-only`: check existing docs for accuracy against codebase, no generation (full verification requires Phase 4 verifier)
- If `--force` and `--verify-only` both appear in `{{SDD_ARGS}}`, `--force` takes precedence
</objective>

<execution_context>
@C:/Users/DS_Chitteti Bhargav/OneDrive - Data Semantics Pvt Ltd/Work/SDD-Setup/sdd-cc/.cursor/sdd/workflows/docs-update.md
</execution_context>

<context>
Arguments: {{SDD_ARGS}}

**Available optional flags (documentation only — not automatically active):**
- `--force` — Regenerate all docs. Overwrites hand-written and SDD docs alike. No preservation prompts.
- `--verify-only` — Check existing docs for accuracy against the codebase. No files are written. Reports VERIFY marker count. Full codebase fact-checking requires the sdd-doc-verifier agent (Phase 4).

**Active flags must be derived from `{{SDD_ARGS}}`:**
- `--force` is active only if the literal `--force` token is present in `{{SDD_ARGS}}`
- `--verify-only` is active only if the literal `--verify-only` token is present in `{{SDD_ARGS}}`
- If neither token appears, run the standard full-phase generation flow
- Do not infer that a flag is active just because it is documented in this prompt
</context>

<process>
Execute the docs-update workflow from @C:/Users/DS_Chitteti Bhargav/OneDrive - Data Semantics Pvt Ltd/Work/SDD-Setup/sdd-cc/.cursor/sdd/workflows/docs-update.md end-to-end.
Preserve all workflow gates (preservation_check, flag handling, wave execution, monorepo dispatch, commit, reporting).
</process>
