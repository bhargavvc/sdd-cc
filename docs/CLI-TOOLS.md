# SDD CLI Tools Reference

> Programmatic API reference for `sdd-tools.cjs`. Used by workflows and agents internally. For user-facing commands, see [Command Reference](COMMANDS.md).

---

## Overview

`sdd-tools.cjs` is a Node.js CLI utility that replaces repetitive inline bash patterns across SDD's ~50 command, workflow, and agent files. It centralizes: config parsing, model resolution, phase lookup, git commits, summary verification, state management, and template operations.

**Location:** `sdd/bin/sdd-tools.cjs`
**Modules:** 15 domain modules in `sdd/bin/lib/`

**Usage:**
```bash
node sdd-tools.cjs <command> [args] [--raw] [--cwd <path>]
```

**Global Flags:**
| Flag | Description |
|------|-------------|
| `--raw` | Machine-readable output (JSON or plain text, no formatting) |
| `--cwd <path>` | Override working directory (for sandboxed subagents) |

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
# Returns: opus | sonnet | haiku | inherit
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
```

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

# Git commit with config checks
node sdd-tools.cjs commit <message> [--files f1 f2] [--amend] [--no-verify]
```

> **`--no-verify`**: Skips pre-commit hooks. Used by parallel executor agents during wave-based execution to avoid build lock contention (e.g., cargo lock fights in Rust projects). The orchestrator runs hooks once after each wave completes. Do not use `--no-verify` during sequential execution — let hooks run normally.

# Web search (requires Brave API key)
node sdd-tools.cjs websearch <query> [--limit N] [--freshness day|week|month]
```

---

## Module Architecture

| Module | File | Exports |
|--------|------|---------|
| Core | `lib/core.cjs` | `error()`, `output()`, `parseArgs()`, shared utilities |
| State | `lib/state.cjs` | All `state` subcommands, `state-snapshot` |
| Phase | `lib/phase.cjs` | Phase CRUD, `find-phase`, `phase-plan-index`, `phases list` |
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
