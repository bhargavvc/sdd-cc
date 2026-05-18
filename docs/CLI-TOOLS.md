# SDD CLI Tools Reference

> Surface-area reference for `sdd/bin/sdd-tools.cjs` (legacy Node CLI). Workflows and agents should prefer `sdd-sdk query` or `@bhargavvc/sdk` where a handler exists — see [SDK and programmatic access](#sdk-and-programmatic-access). For slash commands and user flows, see [Command Reference](COMMANDS.md).

---

## Overview

`sdd-tools.cjs` centralizes config parsing, model resolution, phase lookup, git commits, summary verification, state management, and template operations across SDD commands, workflows, and agents.


|                    |                                                                                                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Shipped path**   | `sdd/bin/sdd-tools.cjs`                                                                                                                                                                      |
| **Implementation** | 20 domain modules under `sdd/bin/lib/` (the directory is authoritative)                                                                                                                        |
| **Status**         | Maintained for parity tests and CJS-only entrypoints; `sdd-sdk query` / SDK registry are the supported path for new orchestration (see [QUERY-HANDLERS.md](../sdk/src/query/QUERY-HANDLERS.md)). |


**Usage (CJS):**

```bash
node sdd-tools.cjs <command> [args] [--raw] [--cwd <path>]
```

**Global flags (CJS):**


| Flag           | Description                                                                  |
| -------------- | ---------------------------------------------------------------------------- |
| `--raw`        | Machine-readable output (JSON or plain text, no formatting)                  |
| `--cwd <path>` | Override working directory (for sandboxed subagents)                         |
| `--ws <name>`  | Workstream context (also honored when the SDK spawns this binary; see below) |


---

## SDK and programmatic access

Use this when authoring workflows, not when you only need the command list below.

**1. CLI — `sdd-sdk query <argv…>`**

- Resolves argv with the same **longest-prefix** rules as the typed registry (`resolveQueryArgv` in `sdk/src/query/registry.ts`). Unregistered commands **fail fast** — use `node …/sdd-tools.cjs` only for handlers not in the registry.
- Full matrix (CJS command → registry key, CLI-only tools, aliases, golden tiers): [sdk/src/query/QUERY-HANDLERS.md](../sdk/src/query/QUERY-HANDLERS.md).

**2. TypeScript — `@bhargavvc/sdk` (`SDDTools`, `createRegistry`)**

- `SDDTools` now routes through the **SDK Runtime Bridge Module** (`sdk/src/query-runtime-bridge.ts`). Native registry dispatch is preferred; subprocess fallback is explicit policy (`allowFallbackToSubprocess`) and can be disabled for strict SDK-only execution.
- `strictSdk` mode fails fast when a command has no native adapter, making SDK publish/readiness checks deterministic.
- Structured bridge observability is available via `onDispatchEvent` (dispatch mode, fallback reason, duration, outcome, error kind).
- For direct typed dispatch without `SDDTools`, use `createRegistry()` from `sdk/src/query/index.ts`, or invoke `sdd-sdk query` (see [QUERY-HANDLERS.md](../sdk/src/query/QUERY-HANDLERS.md)).
- Conventions: mutation event wiring, `SDDError` vs `{ data: { error } }`, locks, and stubs — [QUERY-HANDLERS.md](../sdk/src/query/QUERY-HANDLERS.md).

**CJS → SDK examples (same project directory):**


| Legacy CJS                               | Preferred `sdd-sdk query` (examples) |
| ---------------------------------------- | ------------------------------------ |
| `node sdd-tools.cjs init phase-op 12`    | `sdd-sdk query init phase-op 12`     |
| `node sdd-tools.cjs phase-plan-index 12` | `sdd-sdk query phase-plan-index 12`  |
| `node sdd-tools.cjs state json`          | `sdd-sdk query state json`           |
| `node sdd-tools.cjs roadmap analyze`     | `sdd-sdk query roadmap analyze`      |


**SDK state reads:** `state.json` and `state.load` are both registered query handlers with parity coverage. You can invoke them through `sdd-sdk query …` and through the SDK Runtime Bridge (`SDDTools` → `sdk/src/query-runtime-bridge.ts`), honoring `allowFallbackToSubprocess` / `strictSdk` and emitting `onDispatchEvent` observability. For direct typed dispatch, use `createRegistry()` from `sdk/src/query/index.ts`. Full routing and golden rules: [QUERY-HANDLERS.md](../sdk/src/query/QUERY-HANDLERS.md).

**CLI-only (not in registry):** e.g. **graphify**, **from-sdd2** / **sdd2-import** — call `sdd-tools.cjs` until registered.

**Mutation events (SDK):** `QUERY_MUTATION_COMMANDS` in `sdk/src/query/index.ts` lists commands that may emit structured events after a successful dispatch. Exceptions called out in QUERY-HANDLERS: `state validate` (read-only), `skill-manifest` (writes only with `--write`), `intel update` (stub).

**Golden parity:** Policy and CJS↔SDK test categories are documented under **Golden parity** in [QUERY-HANDLERS.md](../sdk/src/query/QUERY-HANDLERS.md).

---

## State Commands

Manage `.planning/STATE.md` — the project's living memory.

```bash
# Load full project config + state as JSON
node sdd-tools.cjs state load

# Output STATE.md frontmatter as JSON
node sdd-tools.cjs state json

# Update a single field
node sdd-tools.cjs state update <field> <value>

# Get STATE.md content or a specific section
node sdd-tools.cjs state get [section]

# Batch update multiple fields
node sdd-tools.cjs state patch --field1 val1 --field2 val2

# Increment plan counter
node sdd-tools.cjs state advance-plan

# Record execution metrics
node sdd-tools.cjs state record-metric --phase N --plan M --duration Xmin [--tasks N] [--files N]

# Recalculate progress bar
node sdd-tools.cjs state update-progress

# Add a decision
node sdd-tools.cjs state add-decision --summary "..." [--phase N] [--rationale "..."]
# Or from files:
node sdd-tools.cjs state add-decision --summary-file path [--rationale-file path]

# Add/resolve blockers
node sdd-tools.cjs state add-blocker --text "..."
node sdd-tools.cjs state resolve-blocker --text "..."

# Record session continuity
node sdd-tools.cjs state record-session --stopped-at "..." [--resume-file path]

# Phase start — update STATE.md Status/Last activity for a new phase
node sdd-tools.cjs state begin-phase --phase N --name SLUG --plans COUNT

# Agent-discoverable blocker signalling (used by discuss-phase / UI flows)
node sdd-tools.cjs state signal-waiting --type TYPE --question "..." --options "A|B" --phase P
node sdd-tools.cjs state signal-resume
```

### State Snapshot

Structured parse of the full STATE.md:

```bash
node sdd-tools.cjs state-snapshot
```

Returns JSON with: current position, phase, plan, status, decisions, blockers, metrics, last activity.

---

## Phase Commands

Manage phases — directories, numbering, and roadmap sync.

```bash
# Find phase directory by number
node sdd-tools.cjs find-phase <phase>

# Calculate next decimal phase number for insertions
node sdd-tools.cjs phase next-decimal <phase>

# Append new phase to roadmap + create directory
node sdd-tools.cjs phase add <description>

# Insert decimal phase after existing
node sdd-tools.cjs phase insert <after> <description>

# Remove phase, renumber subsequent
node sdd-tools.cjs phase remove <phase> [--force]

# Mark phase complete, update state + roadmap
node sdd-tools.cjs phase complete <phase>

# Index plans with waves and status
node sdd-tools.cjs phase-plan-index <phase>

# List phases with filtering
node sdd-tools.cjs phases list [--type planned|executed|all] [--phase N] [--include-archived]
```

---

## Roadmap Commands

Parse and update `ROADMAP.md`.

```bash
# Extract phase section from ROADMAP.md
node sdd-tools.cjs roadmap get-phase <phase>

# Full roadmap parse with disk status
node sdd-tools.cjs roadmap analyze

# Update progress table row from disk
node sdd-tools.cjs roadmap update-plan-progress <N>
```

---

## Config Commands

Read and write `.planning/config.json`.

```bash
# Initialize config.json with defaults
node sdd-tools.cjs config-ensure-section

# Set a config value (dot notation)
node sdd-tools.cjs config-set <key> <value>

# Get a config value
node sdd-tools.cjs config-get <key>

# Set model profile
node sdd-tools.cjs config-set-model-profile <profile>
```

---

## Model Resolution

```bash
# Get model for agent based on current profile
node sdd-tools.cjs resolve-model <agent-name>
# Raw output returns the selected model ID/tier.
# JSON output also includes profile and, when the active runtime supports it,
# reasoning_effort.
```

Agent names: `sdd-planner`, `sdd-executor`, `sdd-phase-researcher`, `sdd-project-researcher`, `sdd-research-synthesizer`, `sdd-verifier`, `sdd-plan-checker`, `sdd-integration-checker`, `sdd-roadmapper`, `sdd-debugger`, `sdd-codebase-mapper`, `sdd-nyquist-auditor`

---

## Verification Commands

Validate plans, phases, references, and commits.

```bash
# Verify SUMMARY.md file
node sdd-tools.cjs verify-summary <path> [--check-count N]

# Check PLAN.md structure + tasks
node sdd-tools.cjs verify plan-structure <file>

# Check all plans have summaries
node sdd-tools.cjs verify phase-completeness <phase>

# Check @-refs + paths resolve
node sdd-tools.cjs verify references <file>

# Batch verify commit hashes
node sdd-tools.cjs verify commits <hash1> [hash2] ...

# Check must_haves.artifacts
node sdd-tools.cjs verify artifacts <plan-file>

# Check must_haves.key_links
node sdd-tools.cjs verify key-links <plan-file>
```

---

## Validation Commands

Check project integrity.

```bash
# Check phase numbering, disk/roadmap sync
node sdd-tools.cjs validate consistency

# Check .planning/ integrity, optionally repair
node sdd-tools.cjs validate health [--repair]

# Probe context-window utilization for status-line / hook callers (v1.40.0)
node sdd-tools.cjs validate context
```

`validate context` emits a structured envelope with `utilization`, `status`
(`ok` / `warn` / `critical` at the 60 % / 70 % thresholds), and a
`suggestion` string. The same data backs `/sdd-health --context`.

---

## Template Commands

Template selection and filling.

```bash
# Select summary template based on granularity
node sdd-tools.cjs template select <type>

# Fill template with variables
node sdd-tools.cjs template fill <type> --phase N [--plan M] [--name "..."] [--type execute|tdd] [--wave N] [--fields '{json}']
```

Template types for `fill`: `summary`, `plan`, `verification`

---

## Frontmatter Commands

YAML frontmatter CRUD operations on any Markdown file.

```bash
# Extract frontmatter as JSON
node sdd-tools.cjs frontmatter get <file> [--field key]

# Update single field
node sdd-tools.cjs frontmatter set <file> --field key --value jsonVal

# Merge JSON into frontmatter
node sdd-tools.cjs frontmatter merge <file> --data '{json}'

# Validate required fields
node sdd-tools.cjs frontmatter validate <file> --schema plan|summary|verification
```

---

## Scaffold Commands

Create pre-structured files and directories.

```bash
# Create CONTEXT.md template
node sdd-tools.cjs scaffold context --phase N

# Create UAT.md template
node sdd-tools.cjs scaffold uat --phase N

# Create VERIFICATION.md template
node sdd-tools.cjs scaffold verification --phase N

# Create phase directory
node sdd-tools.cjs scaffold phase-dir --phase N --name "phase name"
```

---

## Init Commands (Compound Context Loading)

Load all context needed for a specific workflow in one call. Returns JSON with project info, config, state, and workflow-specific data.

```bash
node sdd-tools.cjs init execute-phase <phase>
node sdd-tools.cjs init plan-phase <phase>
node sdd-tools.cjs init new-project
node sdd-tools.cjs init new-milestone
node sdd-tools.cjs init quick <description>
node sdd-tools.cjs init resume
node sdd-tools.cjs init verify-work <phase>
node sdd-tools.cjs init phase-op <phase>
node sdd-tools.cjs init todos [area]
node sdd-tools.cjs init milestone-op
node sdd-tools.cjs init map-codebase
node sdd-tools.cjs init progress

# Workstream-scoped init (SDK --ws flag)
node sdd-tools.cjs init execute-phase <phase> --ws <name>
node sdd-tools.cjs init plan-phase <phase> --ws <name>
```

**Large payload handling:** When output exceeds ~50KB, the CLI writes to a temp file and returns `@file:/tmp/sdd-init-XXXXX.json`. Workflows check for the `@file:` prefix and read from disk:

```bash
INIT=$(node sdd-tools.cjs init execute-phase "1")
if [[ "$INIT" == @file:* ]]; then INIT=$(cat "${INIT#@file:}"); fi
```

---

## Milestone Commands

```bash
# Archive milestone
node sdd-tools.cjs milestone complete <version> [--name <name>] [--archive-phases]

# Mark requirements as complete
node sdd-tools.cjs requirements mark-complete <ids>
# Accepts: REQ-01,REQ-02 or REQ-01 REQ-02 or [REQ-01, REQ-02]
```

---

## Skill Manifest

Pre-compute and cache skill discovery for faster command loading.

```bash
# Generate skill manifest (writes to .claude/skill-manifest.json)
node sdd-tools.cjs skill-manifest

# Generate with custom output path
node sdd-tools.cjs skill-manifest --output <path>
```

Returns JSON mapping of all available SDD skills with their metadata (name, description, file path, argument hints). Used by the installer and session-start hooks to avoid repeated filesystem scans.

---

## Utility Commands

```bash
# Convert text to URL-safe slug
node sdd-tools.cjs generate-slug "Some Text Here"
# → some-text-here

# Get timestamp
node sdd-tools.cjs current-timestamp [full|date|filename]

# Count and list pending todos
node sdd-tools.cjs list-todos [area]

# Check file/directory existence
node sdd-tools.cjs verify-path-exists <path>

# Aggregate all SUMMARY.md data
node sdd-tools.cjs history-digest

# Extract structured data from SUMMARY.md
node sdd-tools.cjs summary-extract <path> [--fields field1,field2]

# Project statistics
node sdd-tools.cjs stats [json|table]

# Progress rendering
node sdd-tools.cjs progress [json|table|bar]

# Complete a todo
node sdd-tools.cjs todo complete <filename>

# UAT audit — scan all phases for unresolved items
node sdd-tools.cjs audit-uat

# Cross-artifact audit queue — scan `.planning/` for unresolved audit items
node sdd-tools.cjs audit-open [--json]

# Reverse-migrate a SDD-2 project into the current structure (backs `/sdd-import --from-sdd2`)
node sdd-tools.cjs from-sdd2 [--path <dir>] [--force] [--dry-run]

# Git commit with config checks
node sdd-tools.cjs commit <message> [--files f1 f2] [--amend] [--no-verify] [--respect-staged]
```

> `--no-verify`: Skips pre-commit hooks. Used by parallel executor agents during wave-based execution to avoid build lock contention (e.g., cargo lock fights in Rust projects). The orchestrator runs hooks once after each wave completes. Do not use `--no-verify` during sequential execution — let hooks run normally.
> `--files <paths>` **staging behaviour**: by default, `--files` runs `git add -- <path>` for each named file before committing. This overwrites any per-hunk staging set up via `git add -p`. Pass `--respect-staged` to skip the `git add` step and commit only what is already in the index within the requested pathspec. If nothing is staged within that scope, the command returns `{ committed: false, reason: 'nothing staged' }` without error. The trailing `-- <paths>` pathspec on the commit is applied under both modes, so files staged outside the `--files` scope are never included (#3061 invariant).

# Web search (requires Brave API key)
node sdd-tools.cjs websearch <query> [--limit N] [--freshness day|week|month]
```

---

## Graphify

Build, query, and inspect the project knowledge graph in `.planning/graphs/`. Requires `graphify.enabled: true` in `config.json` (see [Configuration Reference](CONFIGURATION.md#graphify-settings)). Graphify is **CJS-only**: `sdd-sdk query` does not yet register graphify handlers — always use `node sdd-tools.cjs graphify …`.

```bash
# Build or rebuild the knowledge graph
node sdd-tools.cjs graphify build

# Search the graph for a term
node sdd-tools.cjs graphify query <term>

# Show graph freshness and statistics
node sdd-tools.cjs graphify status

# Show changes since the last build
node sdd-tools.cjs graphify diff

# Write a named snapshot of the current graph
node sdd-tools.cjs graphify snapshot [name]
```

User-facing entry point: `/sdd-graphify` (see [Command Reference](COMMANDS.md#sdd-graphify)).

---

## Module Architecture

| Module | File | Exports |
|--------|------|---------|
| Core | `lib/core.cjs` | `error()`, `output()`, `parseArgs()`, shared utilities, compatibility re-exports |
| State | `lib/state.cjs` | All `state` subcommands, `state-snapshot` |
| Phase | `lib/phase.cjs` | Phase CRUD, `find-phase`, `phase-plan-index`, `phases list` |
| Planning Workspace | `lib/planning-workspace.cjs` | Planning seam: `planningDir`, `planningPaths`, active workstream routing, `.planning/.lock` |
| Roadmap | `lib/roadmap.cjs` | Roadmap parsing, phase extraction, progress updates |
| Config | `lib/config.cjs` | Config read/write, section initialization |
| Verify | `lib/verify.cjs` | All verification and validation commands |
| Template | `lib/template.cjs` | Template selection and variable filling |
| Frontmatter | `lib/frontmatter.cjs` | YAML frontmatter CRUD |
| Init | `lib/init.cjs` | Compound context loading for all workflows |
| Milestone | `lib/milestone.cjs` | Milestone archival, requirements marking |
| Commands | `lib/commands.cjs` | Misc: slug, timestamp, todos, scaffold, stats, websearch |
| Model Profiles | `lib/model-profiles.cjs` | Profile resolution table |
| UAT | `lib/uat.cjs` | Cross-phase UAT/verification audit |
| Profile Output | `lib/profile-output.cjs` | Developer profile formatting |
| Profile Pipeline | `lib/profile-pipeline.cjs` | Session analysis pipeline |
| Graphify | `lib/graphify.cjs` | Knowledge graph build/query/status/diff/snapshot (backs `/sdd-graphify`) |
| Learnings | `lib/learnings.cjs` | Extract learnings from phases/SUMMARY artifacts (backs `/sdd-extract-learnings`) |
| Audit | `lib/audit.cjs` | Phase/milestone audit queue handlers; `audit-open` helper |
| SDD2 Import | `lib/sdd2-import.cjs` | Reverse-migration importer from SDD-2 projects (backs `/sdd-import --from-sdd2`) |
| Intel | `lib/intel.cjs` | Queryable codebase intelligence index (backs `/sdd-map-codebase --query`) |

---

## Reviewer CLI Routing

`review.models.<cli>` maps a reviewer flavor to a shell command invoked by the code-review workflow. Set via [`/sdd-config --integrations`](COMMANDS.md#sdd-config) or directly:

```bash
sdd-sdk query config-set review.models.codex    "codex exec --model gpt-5"
sdd-sdk query config-set review.models.gemini   "gemini -m gemini-2.5-pro"
sdd-sdk query config-set review.models.opencode "opencode run --model claude-sonnet-4"
sdd-sdk query config-set review.models.claude   ""   # clear — fall back to session model
```

Slugs are validated against `[a-zA-Z0-9_-]+`; empty or path-containing slugs are rejected. See [`docs/CONFIGURATION.md`](CONFIGURATION.md#code-review-cli-routing) for the full field reference.

## Secret Handling

API keys configured via `/sdd-settings` (`brave_search`, `firecrawl`, `exa_search`) are written plaintext to `.planning/config.json` but are masked (`****<last-4>`) in every `config-set` / `config-get` output, confirmation table, and interactive prompt. See `sdd/bin/lib/secrets.cjs` for the masking implementation. The `config.json` file itself is the security boundary — protect it with filesystem permissions and keep it out of git (`.planning/` is gitignored by default).

---

## See also

- [sdk/src/query/QUERY-HANDLERS.md](../sdk/src/query/QUERY-HANDLERS.md) — registry matrix, routing, golden parity, intentional CJS differences
- [Architecture](ARCHITECTURE.md) — where `sdd-sdk query` fits in orchestration
- [Command Reference](COMMANDS.md) — user-facing `/sdd-` commands
