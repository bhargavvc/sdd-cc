# Instructions for SDD

- Use the sdd skill when the user asks for SDD or uses a `sdd-*` command.
- Treat `/sdd-...` or `sdd-...` as command invocations and load the matching file from `.github/skills/sdd-*`.
- When a command says to spawn a subagent, prefer a matching custom agent from `.github/agents`.
- Do not apply SDD workflows unless the user explicitly asks for them.
- After completing any `sdd-*` command (or any deliverable it triggers: feature, bug fix, tests, docs, etc.), ALWAYS: (1) offer the user the next step by prompting via `ask_user`; repeat this feedback loop until the user explicitly indicates they are done.
