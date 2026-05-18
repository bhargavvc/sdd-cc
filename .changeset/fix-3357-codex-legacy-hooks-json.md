---
type: Fixed
pr: 3364
---
**Codex installs now clean up legacy SDD-managed `hooks.json` update hooks after writing the TOML SessionStart hook** — reinstalling no longer leaves duplicate SDD update hooks across `hooks.json` and `config.toml`, while user-owned JSON hooks are preserved. (#3357)
