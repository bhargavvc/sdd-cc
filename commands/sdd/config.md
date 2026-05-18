---
name: sdd:config
description: Configure SDD settings — workflow toggles, advanced knobs, integrations, and model profile
argument-hint: "[--advanced | --integrations | --profile <name>]"
allowed-tools:
  - Read
  - Write
  - Bash
  - AskUserQuestion
requires: [code-review, review, settings]
---

<objective>
Configure SDD settings interactively with a single consolidated command.

Mode routing:
- **default** (no flag): Common-case toggles (model, research, plan_check, verifier, branching) → settings workflow
- **--advanced**: Power-user knobs (planning tuning, timeouts, branch templates, cross-AI execution) → settings-advanced workflow
- **--integrations**: Third-party API keys, code-review CLI routing, agent-skill injection → settings-integrations workflow
- **--profile <name>**: Switch model profile (quality|balanced|budget|inherit) → set-profile (inline)
</objective>

<routing>

| Flag | Action | Workflow |
|------|--------|----------|
| (none) | Interactive 5-question common-case config prompt | settings |
| --advanced | Power-user knobs: planning, execution, discussion, cross-AI, git, runtime | settings-advanced |
| --integrations | API keys (Brave/Firecrawl/Exa), review CLI routing, agent skills | settings-integrations |
| --profile &lt;name&gt; | Switch model profile without interactive prompt | sdd-sdk config-set-model-profile |

</routing>

<execution_context>
@~/.claude/sdd/workflows/settings.md
@~/.claude/sdd/workflows/settings-advanced.md
@~/.claude/sdd/workflows/settings-integrations.md
</execution_context>

<context>
Arguments: $ARGUMENTS

Parse the first token of $ARGUMENTS:
- If it is `--advanced`: strip the flag, execute settings-advanced workflow
- If it is `--integrations`: strip the flag, execute settings-integrations workflow
- If it starts with `--profile`: extract the profile name (remainder after `--profile`), then:
  1. **Pre-flight check (#2439):** verify `sdd-sdk` is on PATH via `command -v sdd-sdk`.
     If absent, emit the install hint `Install SDD via 'npm i -g sdd'` and stop —
     do NOT invoke `sdd-sdk` directly (avoids the opaque `command not found: sdd-sdk` failure).
  2. Run: `sdd-sdk query config-set-model-profile <profile-name> --raw` and display the output verbatim.
- Otherwise: execute settings workflow (no argument needed)
</context>

<process>
1. Parse the leading flag (if any) from $ARGUMENTS.
2. Load and execute the appropriate workflow end-to-end, or run the inline SDK command for --profile.
3. Preserve all workflow gates from the target workflow.
</process>
