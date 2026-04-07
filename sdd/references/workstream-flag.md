# Workstream Flag (`--ws`)

## Overview

The `--ws <name>` flag scopes SDD operations to a specific workstream, enabling
parallel milestone work by multiple Claude Code instances on the same codebase.

## Resolution Priority

1. `--ws <name>` flag (explicit, highest priority)
2. `SDD_WORKSTREAM` environment variable (per-instance)
3. `.planning/active-workstream` file (shared, last-writer-wins)
4. `null` — flat mode (no workstreams)

## Routing Propagation

All workflow routing commands include `${SDD_WS}` which:
- Expands to `--ws <name>` when a workstream is active
- Expands to empty string in flat mode (backward compatible)

This ensures workstream scope chains automatically through the workflow:
`new-milestone → discuss-phase → plan-phase → execute-phase → transition`

## Directory Structure

```
.planning/
├── PROJECT.md          # Shared
├── config.json         # Shared
├── milestones/         # Shared
├── codebase/           # Shared
├── active-workstream   # Points to current ws
└── workstreams/
    ├── feature-a/      # Workstream A
    │   ├── STATE.md
    │   ├── ROADMAP.md
    │   ├── REQUIREMENTS.md
    │   └── phases/
    └── feature-b/      # Workstream B
        ├── STATE.md
        ├── ROADMAP.md
        ├── REQUIREMENTS.md
        └── phases/
```

## CLI Usage

```bash
# All sdd-tools commands accept --ws
node sdd-tools.cjs state json --ws feature-a
node sdd-tools.cjs find-phase 3 --ws feature-b

# Workstream CRUD
node sdd-tools.cjs workstream create <name>
node sdd-tools.cjs workstream list
node sdd-tools.cjs workstream status <name>
node sdd-tools.cjs workstream complete <name>
```
