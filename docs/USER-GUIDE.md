# SDD User Guide

A detailed reference for workflows, troubleshooting, and configuration. For quick-start setup, see the [README](../README.md).

---

## Table of Contents

- [Workflow Diagrams](#workflow-diagrams)
- [UI Design Contract](#ui-design-contract)
- [Spiking & Sketching](#spiking--sketching)
- [Backlog & Threads](#backlog--threads)
- [Workstreams](#workstreams)
- [Security](#security)
- [Command Reference](#command-reference)
- [Configuration Reference](#configuration-reference)
- [Usage Examples](#usage-examples)
- [Troubleshooting](#troubleshooting)
- [Recovery Quick Reference](#recovery-quick-reference)

---

## Workflow Diagrams

### Full Project Lifecycle

```
  ┌──────────────────────────────────────────────────┐
  │                   NEW PROJECT                    │
  │  /sdd-new-project                                │
  │  Questions -> Research -> Requirements -> Roadmap│
  └─────────────────────────┬────────────────────────┘
                            │
             ┌──────────────▼─────────────┐
             │      FOR EACH PHASE:       │
             │                            │
             │  ┌────────────────────┐    │
             │  │ /sdd-discuss-phase │    │  <- Lock in preferences
             │  └──────────┬─────────┘    │
             │             │              │
             │  ┌──────────▼─────────┐    │
             │  │ /sdd-ui-phase      │    │  <- Design contract (frontend)
             │  └──────────┬─────────┘    │
             │             │              │
             │  ┌──────────▼─────────┐    │
             │  │ /sdd-plan-phase    │    │  <- Research + Plan + Verify
             │  └──────────┬─────────┘    │
             │             │              │
             │  ┌──────────▼─────────┐    │
             │  │ /sdd-execute-phase │    │  <- Parallel execution
             │  └──────────┬─────────┘    │
             │             │              │
             │  ┌──────────▼─────────┐    │
             │  │ /sdd-verify-work   │    │  <- Manual UAT
             │  └──────────┬─────────┘    │
             │             │              │
             │  ┌──────────▼─────────┐    │
             │  │ /sdd-ship          │    │  <- Create PR (optional)
             │  └──────────┬─────────┘    │
             │             │              │
             │     Next Phase?────────────┘
             │             │ No
             └─────────────┼──────────────┘
                            │
            ┌───────────────▼──────────────┐
            │  /sdd-audit-milestone        │
            │  /sdd-complete-milestone     │
            └───────────────┬──────────────┘
                            │
                   Another milestone?
                       │          │
                      Yes         No -> Done!
                       │
               ┌───────▼──────────────┐
               │  /sdd-new-milestone  │
               └──────────────────────┘
```

### Planning Agent Coordination

```
  /sdd-plan-phase N
         │
         ├── Phase Researcher (x4 parallel)
         │     ├── Stack researcher
         │     ├── Features researcher
         │     ├── Architecture researcher
         │     └── Pitfalls researcher
         │           │
         │     ┌──────▼──────┐
         │     │ RESEARCH.md │
         │     └──────┬──────┘
         │            │
         │     ┌──────▼──────┐
         │     │   Planner   │  <- Reads PROJECT.md, REQUIREMENTS.md,
         │     │             │     CONTEXT.md, RESEARCH.md
         │     └──────┬──────┘
         │            │
         │     ┌──────▼───────────┐     ┌────────┐
         │     │   Plan Checker   │────>│ PASS?  │
         │     └──────────────────┘     └───┬────┘
         │                                  │
         │                             Yes  │  No
         │                              │   │   │
         │                              │   └───┘  (loop, up to 3x)
         │                              │
         │                        ┌─────▼──────┐
         │                        │ PLAN files │
         │                        └────────────┘
         └── Done
```

### Validation Architecture (Nyquist Layer)

During plan-phase research, SDD now maps automated test coverage to each phase
requirement before any code is written. This ensures that when Claude's executor
commits a task, a feedback mechanism already exists to verify it within seconds.

The researcher detects your existing test infrastructure, maps each requirement to
a specific test command, and identifies any test scaffolding that must be created
before implementation begins (Wave 0 tasks).

The plan-checker enforces this as an 8th verification dimension: plans where tasks
lack automated verify commands will not be approved.

**Output:** `{phase}-VALIDATION.md` -- the feedback contract for the phase.

**Disable:** Set `workflow.nyquist_validation: false` in `/sdd-settings` for
rapid prototyping phases where test infrastructure isn't the focus.

### Retroactive Validation (`/sdd-validate-phase`)

For phases executed before Nyquist validation existed, or for existing codebases
with only traditional test suites, retroactively audit and fill coverage gaps:

```
  /sdd-validate-phase N
         |
         +-- Detect state (VALIDATION.md exists? SUMMARY.md exists?)
         |
         +-- Discover: scan implementation, map requirements to tests
         |
         +-- Analyze gaps: which requirements lack automated verification?
         |
         +-- Present gap plan for approval
         |
         +-- Spawn auditor: generate tests, run, debug (max 3 attempts)
         |
         +-- Update VALIDATION.md
               |
               +-- COMPLIANT -> all requirements have automated checks
               +-- PARTIAL -> some gaps escalated to manual-only
```

The auditor never modifies implementation code — only test files and
VALIDATION.md. If a test reveals an implementation bug, it's flagged as an
escalation for you to address.

**When to use:** After executing phases that were planned before Nyquist was
enabled, or after `/sdd-audit-milestone` surfaces Nyquist compliance gaps.

### Assumptions Discussion Mode

By default, `/sdd-discuss-phase` asks open-ended questions about your implementation preferences. Assumptions mode inverts this: SDD reads your codebase first, surfaces structured assumptions about how it would build the phase, and asks only for corrections.

**Enable:** Set `workflow.discuss_mode` to `'assumptions'` via `/sdd-settings`.

**How it works:**
1. Reads PROJECT.md, codebase mapping, and existing conventions
2. Generates a structured list of assumptions (tech choices, patterns, file locations)
3. Presents assumptions for you to confirm, correct, or expand
4. Writes CONTEXT.md from confirmed assumptions

**When to use:**
- Experienced developers who already know their codebase well
- Rapid iteration where open-ended questions slow you down
- Projects where patterns are well-established and predictable

See [docs/workflow-discuss-mode.md](workflow-discuss-mode.md) for the full discuss-mode reference.

---

## UI Design Contract

### Why

AI-generated frontends are visually inconsistent not because Claude Code is bad at UI but because no design contract existed before execution. Five components built without a shared spacing scale, color contract, or copywriting standard produce five slightly different visual decisions.

`/sdd-ui-phase` locks the design contract before planning. `/sdd-ui-review` audits the result after execution.

### Commands

| Command | Description |
|---------|-------------|
| `/sdd-ui-phase [N]` | Generate UI-SPEC.md design contract for a frontend phase |
| `/sdd-ui-review [N]` | Retroactive 6-pillar visual audit of implemented UI |

### Workflow: `/sdd-ui-phase`

**When to run:** After `/sdd-discuss-phase`, before `/sdd-plan-phase` — for phases with frontend/UI work.

**Flow:**
1. Reads CONTEXT.md, RESEARCH.md, REQUIREMENTS.md for existing decisions
2. Detects design system state (shadcn components.json, Tailwind config, existing tokens)
3. shadcn initialization gate — offers to initialize if React/Next.js/Vite project has none
4. Asks only unanswered design contract questions (spacing, typography, color, copywriting, registry safety)
5. Writes `{phase}-UI-SPEC.md` to phase directory
6. Validates against 6 dimensions (Copywriting, Visuals, Color, Typography, Spacing, Registry Safety)
7. Revision loop if BLOCKED (max 2 iterations)

**Output:** `{padded_phase}-UI-SPEC.md` in `.planning/phases/{phase-dir}/`

### Workflow: `/sdd-ui-review`

**When to run:** After `/sdd-execute-phase` or `/sdd-verify-work` — for any project with frontend code.

**Standalone:** Works on any project, not just SDD-managed ones. If no UI-SPEC.md exists, audits against abstract 6-pillar standards.

**6 Pillars (scored 1-4 each):**
1. Copywriting — CTA labels, empty states, error states
2. Visuals — focal points, visual hierarchy, icon accessibility
3. Color — accent usage discipline, 60/30/10 compliance
4. Typography — font size/weight constraint adherence
5. Spacing — grid alignment, token consistency
6. Experience Design — loading/error/empty state coverage

**Output:** `{padded_phase}-UI-REVIEW.md` in phase directory with scores and top 3 priority fixes.

### Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `workflow.ui_phase` | `true` | Generate UI design contracts for frontend phases |
| `workflow.ui_safety_gate` | `true` | plan-phase prompts to run /sdd-ui-phase for frontend phases |

Both follow the absent=enabled pattern. Disable via `/sdd-settings`.

### shadcn Initialization

For React/Next.js/Vite projects, the UI researcher offers to initialize shadcn if no `components.json` is found. The flow:

1. Visit `ui.shadcn.com/create` and configure your preset
2. Copy the preset string
3. Run `npx shadcn init --preset {paste}`
4. Preset encodes the entire design system — colors, border radius, fonts

The preset string becomes a first-class SDD planning artifact, reproducible across phases and milestones.

### Registry Safety Gate

Third-party shadcn registries can inject arbitrary code. The safety gate requires:
- `npx shadcn view {component}` — inspect before installing
- `npx shadcn diff {component}` — compare against official

Controlled by `workflow.ui_safety_gate` config toggle.

### Screenshot Storage

`/sdd-ui-review` captures screenshots via Playwright CLI to `.planning/ui-reviews/`. A `.gitignore` is created automatically to prevent binary files from reaching git. Screenshots are cleaned up during `/sdd-complete-milestone`.

---

## Spiking & Sketching

Use `/sdd-spike` to validate technical feasibility before planning, and `/sdd-sketch` to explore visual direction before designing. Both store artifacts in `.planning/` and integrate with the project-skills system via their wrap-up companions.

### When to Spike

Spike when you're uncertain whether a technical approach is feasible or want to compare two implementations before committing a phase to one of them.

```
/sdd-spike                              # Interactive intake — describes the question, you confirm
/sdd-spike "can we stream LLM tokens through SSE"
/sdd-spike --quick "websocket vs SSE latency"
```

Each spike runs 2–5 experiments. Every experiment has:
- A **Given / When / Then** hypothesis written before any code
- **Working code** (not pseudocode)
- A **VALIDATED / INVALIDATED / PARTIAL** verdict with evidence

Results land in `.planning/spikes/NNN-name/README.md` and are indexed in `.planning/spikes/MANIFEST.md`.

Once you have signal, run `/sdd-spike-wrap-up` to package the findings into `.claude/skills/spike-findings-[project]/` — future sessions will load them automatically via project-skills discovery.

### When to Sketch

Sketch when you need to compare layout structures, interaction models, or visual treatments before writing any real component code.

```
/sdd-sketch                             # Mood intake — explores feel, references, core action
/sdd-sketch "dashboard layout"
/sdd-sketch --quick "sidebar navigation"
/sdd-sketch --text "onboarding flow"    # For non-Claude runtimes (Codex, Gemini, etc.)
```

Each sketch answers **one design question** with 2–3 variants in a single `index.html` you open directly in a browser — no build step. Variants use tab navigation and shared CSS variables from `themes/default.css`. All interactive elements (hover, click, transitions) are functional.

After picking a winner, run `/sdd-sketch-wrap-up` to capture the visual decisions into `.claude/skills/sketch-findings-[project]/`.

### Spike → Sketch → Phase Flow

```
/sdd-spike "SSE vs WebSocket"     # Validate the approach
/sdd-spike-wrap-up                # Package learnings

/sdd-sketch "real-time feed UI"   # Explore the design
/sdd-sketch-wrap-up               # Package decisions

/sdd-discuss-phase N              # Lock in preferences (now informed by spike + sketch)
/sdd-plan-phase N                 # Plan with confidence
```

---

## Backlog & Threads

### Backlog Parking Lot

Ideas that aren't ready for active planning go into the backlog using 999.x numbering, keeping them outside the active phase sequence.

```
/sdd-add-backlog "GraphQL API layer"     # Creates 999.1-graphql-api-layer/
/sdd-add-backlog "Mobile responsive"     # Creates 999.2-mobile-responsive/
```

Backlog items get full phase directories, so you can use `/sdd-discuss-phase 999.1` to explore an idea further or `/sdd-plan-phase 999.1` when it's ready.

**Review and promote** with `/sdd-review-backlog` — it shows all backlog items and lets you promote (move to active sequence), keep (leave in backlog), or remove (delete).

### Seeds

Seeds are forward-looking ideas with trigger conditions. Unlike backlog items, seeds surface automatically when the right milestone arrives.

```
/sdd-plant-seed "Add real-time collab when WebSocket infra is in place"
```

Seeds preserve the full WHY and WHEN to surface. `/sdd-new-milestone` scans all seeds and presents matches.

**Storage:** `.planning/seeds/SEED-NNN-slug.md`

### Persistent Context Threads

Threads are lightweight cross-session knowledge stores for work that spans multiple sessions but doesn't belong to any specific phase.

```
/sdd-thread                              # List all threads
/sdd-thread fix-deploy-key-auth          # Resume existing thread
/sdd-thread "Investigate TCP timeout"    # Create new thread
```

Threads are lighter weight than `/sdd-pause-work` — no phase state, no plan context. Each thread file includes Goal, Context, References, and Next Steps sections.

Threads can be promoted to phases (`/sdd-add-phase`) or backlog items (`/sdd-add-backlog`) when they mature.

**Storage:** `.planning/threads/{slug}.md`

---

## Workstreams

Workstreams let you work on multiple milestone areas concurrently without state collisions. Each workstream gets its own isolated `.planning/` state, so switching between them doesn't clobber progress.

**When to use:** You're working on milestone features that span different concern areas (e.g., backend API and frontend dashboard) and want to plan, execute, or discuss them independently without context bleed.

### Commands

| Command | Purpose |
|---------|---------|
| `/sdd-workstreams create <name>` | Create a new workstream with isolated planning state |
| `/sdd-workstreams switch <name>` | Switch active context to a different workstream |
| `/sdd-workstreams list` | Show all workstreams and which is active |
| `/sdd-workstreams complete <name>` | Mark a workstream as done and archive its state |

### How It Works

Each workstream maintains its own `.planning/` directory subtree. When you switch workstreams, SDD swaps the active planning context so that `/sdd-progress`, `/sdd-discuss-phase`, `/sdd-plan-phase`, and other commands operate on that workstream's state. Active context is session-scoped when the runtime exposes a stable session identifier, which prevents one terminal or AI instance from repointing another instance's `STATE.md`.

This is lighter weight than `/sdd-new-workspace` (which creates separate repo worktrees). Workstreams share the same codebase and git history but isolate planning artifacts.

---

## Security

### Defense-in-Depth (v1.27)

SDD generates markdown files that become LLM system prompts. This means any user-controlled text flowing into planning artifacts is a potential indirect prompt injection vector. v1.27 introduced centralized security hardening:

**Path Traversal Prevention:**
All user-supplied file paths (`--text-file`, `--prd`) are validated to resolve within the project directory. macOS `/var` → `/private/var` symlink resolution is handled.

**Prompt Injection Detection:**
The `security.cjs` module scans for known injection patterns (role overrides, instruction bypasses, system tag injections) in user-supplied text before it enters planning artifacts.

**Runtime Hooks:**
- `sdd-prompt-guard.js` — Scans Write/Edit calls to `.planning/` for injection patterns (always active, advisory-only)
- `sdd-workflow-guard.js` — Warns on file edits outside SDD workflow context (opt-in via `hooks.workflow_guard`)

**CI Scanner:**
`prompt-injection-scan.test.cjs` scans all agent, workflow, and command files for embedded injection vectors. Run as part of the test suite.

---

### Execution Wave Coordination

```
  /sdd-execute-phase N
         │
         ├── Analyze plan dependencies
         │
         ├── Wave 1 (independent plans):
         │     ├── Executor A (fresh 200K context) -> commit
         │     └── Executor B (fresh 200K context) -> commit
         │
         ├── Wave 2 (depends on Wave 1):
         │     └── Executor C (fresh 200K context) -> commit
         │
         └── Verifier
               ├── Check codebase against phase goals
               ├── Test quality audit (disabled tests, circular patterns, assertion strength)
               │
               ├── PASS -> VERIFICATION.md (success)
               └── FAIL -> Issues logged for /sdd-verify-work
```

### Brownfield Workflow (Existing Codebase)

```
  /sdd-map-codebase
         │
         ├── Stack Mapper     -> codebase/STACK.md
         ├── Arch Mapper      -> codebase/ARCHITECTURE.md
         ├── Convention Mapper -> codebase/CONVENTIONS.md
         └── Concern Mapper   -> codebase/CONCERNS.md
                │
        ┌───────▼──────────┐
        │ /sdd-new-project │  <- Questions focus on what you're ADDING
        └──────────────────┘
```

---

## Code Review Workflow

### Phase Code Review

After executing a phase, run a structured code review before UAT:

```bash
/sdd-code-review 3               # Review all changed files in phase 3
/sdd-code-review 3 --depth=deep  # Deep cross-file review (import graphs, call chains)
```

The reviewer scopes files automatically using SUMMARY.md (preferred) or git diff fallback. Findings are classified as Critical, Warning, or Info in `{phase}-REVIEW.md`.

```bash
/sdd-code-review-fix 3           # Fix Critical + Warning findings atomically
/sdd-code-review-fix 3 --auto    # Fix and re-review until clean (max 3 iterations)
```

### Autonomous Audit-to-Fix

To run an audit and fix all auto-fixable issues in one pass:

```bash
/sdd-audit-fix                   # Audit + classify + fix (medium+ severity, max 5)
/sdd-audit-fix --dry-run         # Preview classification without fixing
```

### Code Review in the Full Phase Lifecycle

The review step slots in after execution and before UAT:

```
/sdd-execute-phase N   ->  /sdd-code-review N  ->  /sdd-code-review-fix N  ->  /sdd-verify-work N
```

---

## Exploration & Discovery

### Socratic Exploration

Before committing to a new phase or plan, use `/sdd-explore` to think through the idea:

```bash
/sdd-explore                           # Open-ended ideation
/sdd-explore "caching strategy"        # Explore a specific topic
```

The exploration session guides you through probing questions, optionally spawns a research agent, and routes output to the appropriate SDD artifact: note, todo, seed, research question, requirements update, or new phase.

### Codebase Intelligence

For queryable codebase insights without reading the entire codebase, enable the intel system:

```json
{ "intel": { "enabled": true } }
```

Then build the index:

```bash
/sdd-intel refresh             # Analyze codebase and write .planning/intel/ files
/sdd-intel query auth          # Search for a term across all intel files
/sdd-intel status              # Check freshness of intel files
/sdd-intel diff                # See what changed since last snapshot
```

Intel files cover stack, API surface, dependency graph, file roles, and architecture decisions.

### Quick Scan

For a focused assessment without full `/sdd-map-codebase` overhead:

```bash
/sdd-scan                      # Quick tech + arch overview
/sdd-scan --focus quality      # Quality and code health only
/sdd-scan --focus concerns     # Risk areas and concerns
```

---

## Command Reference

### Core Workflow

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/sdd-new-project` | Full project init: questions, research, requirements, roadmap | Start of a new project |
| `/sdd-new-project --auto @idea.md` | Automated init from document | Have a PRD or idea doc ready |
| `/sdd-discuss-phase [N]` | Capture implementation decisions | Before planning, to shape how it gets built |
| `/sdd-ui-phase [N]` | Generate UI design contract | After discuss-phase, before plan-phase (frontend phases) |
| `/sdd-plan-phase [N]` | Research + plan + verify | Before executing a phase |
| `/sdd-execute-phase <N>` | Execute all plans in parallel waves | After planning is complete |
| `/sdd-verify-work [N]` | Manual UAT with auto-diagnosis | After execution completes |
| `/sdd-ship [N]` | Create PR from verified work | After verification passes |
| `/sdd-fast <text>` | Inline trivial tasks — skips planning entirely | Typo fixes, config changes, small refactors |
| `/sdd-next` | Auto-detect state and run next step | Anytime — "what should I do next?" |
| `/sdd-ui-review [N]` | Retroactive 6-pillar visual audit | After execution or verify-work (frontend projects) |
| `/sdd-audit-milestone` | Verify milestone met its definition of done | Before completing milestone |
| `/sdd-complete-milestone` | Archive milestone, tag release | All phases verified |
| `/sdd-new-milestone [name]` | Start next version cycle | After completing a milestone |

### Navigation

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/sdd-progress` | Show status and next steps | Anytime -- "where am I?" |
| `/sdd-resume-work` | Restore full context from last session | Starting a new session |
| `/sdd-pause-work` | Save structured handoff (HANDOFF.json + continue-here.md) | Stopping mid-phase |
| `/sdd-session-report` | Generate session summary with work and outcomes | End of session, stakeholder sharing |
| `/sdd-help` | Show all commands | Quick reference |
| `/sdd-update` | Update SDD with changelog preview | Check for new versions |
| `/sdd-join-discord` | Open Discord community invite | Questions or community |

### Phase Management

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/sdd-add-phase` | Append new phase to roadmap | Scope grows after initial planning |
| `/sdd-insert-phase [N]` | Insert urgent work (decimal numbering) | Urgent fix mid-milestone |
| `/sdd-remove-phase [N]` | Remove future phase and renumber | Descoping a feature |
| `/sdd-list-phase-assumptions [N]` | Preview Claude's intended approach | Before planning, to validate direction |
| `/sdd-analyze-dependencies` | Detect phase dependencies for ROADMAP.md | Before `/sdd-manager` when phases have empty `Depends on` |
| `/sdd-plan-milestone-gaps` | Create phases for audit gaps | After audit finds missing items |
| `/sdd-research-phase [N]` | Deep ecosystem research only | Complex or unfamiliar domain |

### Brownfield & Utilities

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/sdd-map-codebase` | Analyze existing codebase (4 parallel agents) | Before `/sdd-new-project` on existing code |
| `/sdd-scan [--focus area]` | Rapid single-focus codebase scan (1 agent) | Quick assessment of a specific area |
| `/sdd-intel [query\|status\|diff\|refresh]` | Query codebase intelligence index | Look up APIs, deps, or architecture decisions |
| `/sdd-explore [topic]` | Socratic ideation — think through an idea before committing | Exploring unfamiliar solution space |
| `/sdd-quick` | Ad-hoc task with SDD guarantees | Bug fixes, small features, config changes |
| `/sdd-autonomous` | Run remaining phases autonomously (`--from N`, `--to N`) | Hands-free multi-phase execution |
| `/sdd-undo --last N\|--phase NN\|--plan NN-MM` | Safe git revert using phase manifest | Roll back a bad execution |
| `/sdd-import --from <file>` | Ingest external plan with conflict detection | Import plans from teammates or other tools |
| `/sdd-debug [desc]` | Systematic debugging with persistent state (`--diagnose` for no-fix mode) | When something breaks |
| `/sdd-forensics` | Diagnostic report for workflow failures | When state, artifacts, or git history seem corrupted |
| `/sdd-add-todo [desc]` | Capture an idea for later | Think of something during a session |
| `/sdd-check-todos` | List pending todos | Review captured ideas |
| `/sdd-settings` | Configure workflow toggles and model profile | Change model, toggle agents |
| `/sdd-set-profile <profile>` | Quick profile switch | Change cost/quality tradeoff |
| `/sdd-reapply-patches` | Restore local modifications after update | After `/sdd-update` if you had local edits |

### Code Quality & Review

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/sdd-review --phase N` | Cross-AI peer review from external CLIs | Before executing, to validate plans |
| `/sdd-code-review <N>` | Review source files changed in a phase for bugs and security issues | After execution, before verification |
| `/sdd-code-review-fix <N>` | Auto-fix issues found by `/sdd-code-review` | After code review produces REVIEW.md |
| `/sdd-audit-fix` | Autonomous audit-to-fix pipeline with classification and atomic commits | After UAT surfaces fixable issues |
| `/sdd-pr-branch` | Clean PR branch filtering `.planning/` commits | Before creating PR with planning-free diff |
| `/sdd-audit-uat` | Audit verification debt across all phases | Before milestone completion |

### Backlog & Threads

| Command | Purpose | When to Use |
|---------|---------|-------------|
| `/sdd-add-backlog <desc>` | Add idea to backlog parking lot (999.x) | Ideas not ready for active planning |
| `/sdd-review-backlog` | Promote/keep/remove backlog items | Before new milestone, to prioritize |
| `/sdd-plant-seed <idea>` | Forward-looking idea with trigger conditions | Ideas that should surface at a future milestone |
| `/sdd-thread [name]` | Persistent context threads | Cross-session work outside the phase structure |

---

## Configuration Reference

SDD stores project settings in `.planning/config.json`. Configure during `/sdd-new-project` or update later with `/sdd-settings`.

### Full config.json Schema

```json
{
  "mode": "interactive",
  "granularity": "standard",
  "model_profile": "balanced",
  "planning": {
    "commit_docs": true,
    "search_gitignored": false
  },
  "workflow": {
    "research": true,
    "plan_check": true,
    "verifier": true,
    "nyquist_validation": true,
    "ui_phase": true,
    "ui_safety_gate": true,
    "research_before_questions": false,
    "discuss_mode": "standard",
    "skip_discuss": false
  },
  "resolve_model_ids": "anthropic",
  "hooks": {
    "context_warnings": true,
    "workflow_guard": false
  },
  "git": {
    "branching_strategy": "none",
    "phase_branch_template": "sdd/phase-{phase}-{slug}",
    "milestone_branch_template": "sdd/{milestone}-{slug}",
    "quick_branch_template": null
  }
}
```

### Core Settings

| Setting | Options | Default | What it Controls |
|---------|---------|---------|------------------|
| `mode` | `interactive`, `yolo` | `interactive` | `yolo` auto-approves decisions; `interactive` confirms at each step |
| `granularity` | `coarse`, `standard`, `fine` | `standard` | Phase granularity: how finely scope is sliced (3-5, 5-8, or 8-12 phases) |
| `model_profile` | `quality`, `balanced`, `budget`, `inherit` | `balanced` | Model tier for each agent (see table below) |

### Planning Settings

| Setting | Options | Default | What it Controls |
|---------|---------|---------|------------------|
| `planning.commit_docs` | `true`, `false` | `true` | Whether `.planning/` files are committed to git |
| `planning.search_gitignored` | `true`, `false` | `false` | Add `--no-ignore` to broad searches to include `.planning/` |

> **Note:** If `.planning/` is in `.gitignore`, `commit_docs` is automatically `false` regardless of the config value.

### Workflow Toggles

| Setting | Options | Default | What it Controls |
|---------|---------|---------|------------------|
| `workflow.research` | `true`, `false` | `true` | Domain investigation before planning |
| `workflow.plan_check` | `true`, `false` | `true` | Plan verification loop (up to 3 iterations) |
| `workflow.verifier` | `true`, `false` | `true` | Post-execution verification against phase goals |
| `workflow.nyquist_validation` | `true`, `false` | `true` | Validation architecture research during plan-phase; 8th plan-check dimension |
| `workflow.ui_phase` | `true`, `false` | `true` | Generate UI design contracts for frontend phases |
| `workflow.ui_safety_gate` | `true`, `false` | `true` | plan-phase prompts to run /sdd-ui-phase for frontend phases |
| `workflow.research_before_questions` | `true`, `false` | `false` | Run research before discussion questions instead of after |
| `workflow.discuss_mode` | `standard`, `assumptions` | `standard` | Discussion style: open-ended questions vs. codebase-driven assumptions |
| `workflow.skip_discuss` | `true`, `false` | `false` | Skip discuss-phase entirely in autonomous mode; writes minimal CONTEXT.md from ROADMAP phase goal |
| `response_language` | language code | (none) | Agent response language for cross-phase consistency (e.g., `"pt"`, `"ko"`, `"ja"`) |

### Hook Settings

| Setting | Options | Default | What it Controls |
|---------|---------|---------|------------------|
| `hooks.context_warnings` | `true`, `false` | `true` | Context window usage warnings |
| `hooks.workflow_guard` | `true`, `false` | `false` | Warn on file edits outside SDD workflow context |

Disable workflow toggles to speed up phases in familiar domains or when conserving tokens.

### Git Branching

| Setting | Options | Default | What it Controls |
|---------|---------|---------|------------------|
| `git.branching_strategy` | `none`, `phase`, `milestone` | `none` | When and how branches are created |
| `git.phase_branch_template` | Template string | `sdd/phase-{phase}-{slug}` | Branch name for phase strategy |
| `git.milestone_branch_template` | Template string | `sdd/{milestone}-{slug}` | Branch name for milestone strategy |
| `git.quick_branch_template` | Template string or `null` | `null` | Optional branch name for `/sdd-quick` tasks |

**Branching strategies explained:**

| Strategy | Creates Branch | Scope | Best For |
|----------|---------------|-------|----------|
| `none` | Never | N/A | Solo development, simple projects |
| `phase` | At each `execute-phase` | One phase per branch | Code review per phase, granular rollback |
| `milestone` | At first `execute-phase` | All phases share one branch | Release branches, PR per version |

**Template variables:** `{phase}` = zero-padded number (e.g., "03"), `{slug}` = lowercase hyphenated name, `{milestone}` = version (e.g., "v1.0"), `{num}` / `{quick}` = quick task ID (e.g., "260317-abc").

Example quick-task branching:

```json
"git": {
  "quick_branch_template": "sdd/quick-{num}-{slug}"
}
```

### Model Profiles (Per-Agent Breakdown)

| Agent | `quality` | `balanced` | `budget` | `inherit` |
|-------|-----------|------------|----------|-----------|
| sdd-planner | Opus | Opus | Sonnet | Inherit |
| sdd-roadmapper | Opus | Sonnet | Sonnet | Inherit |
| sdd-executor | Opus | Sonnet | Sonnet | Inherit |
| sdd-phase-researcher | Opus | Sonnet | Haiku | Inherit |
| sdd-project-researcher | Opus | Sonnet | Haiku | Inherit |
| sdd-research-synthesizer | Sonnet | Sonnet | Haiku | Inherit |
| sdd-debugger | Opus | Sonnet | Sonnet | Inherit |
| sdd-codebase-mapper | Sonnet | Haiku | Haiku | Inherit |
| sdd-verifier | Sonnet | Sonnet | Haiku | Inherit |
| sdd-plan-checker | Sonnet | Sonnet | Haiku | Inherit |
| sdd-integration-checker | Sonnet | Sonnet | Haiku | Inherit |

**Profile philosophy:**
- **quality** -- Opus for all decision-making agents, Sonnet for read-only verification. Use when quota is available and the work is critical.
- **balanced** -- Opus only for planning (where architecture decisions happen), Sonnet for everything else. The default for good reason.
- **budget** -- Sonnet for anything that writes code, Haiku for research and verification. Use for high-volume work or less critical phases.
- **inherit** -- All agents use the current session model. Best when switching models dynamically (e.g. OpenCode or Kilo `/model`), or when using Claude Code with non-Anthropic providers (OpenRouter, local models) to avoid unexpected API costs. For non-Claude runtimes (Codex, OpenCode, Gemini CLI, Kilo), the installer sets `resolve_model_ids: "omit"` automatically -- see [Non-Claude Runtimes](#using-non-claude-runtimes-codex-opencode-gemini-cli-kilo).

---

## Usage Examples

### New Project (Full Cycle)

```bash
claude --dangerously-skip-permissions
/sdd-new-project            # Answer questions, configure, approve roadmap
/clear
/sdd-discuss-phase 1        # Lock in your preferences
/sdd-ui-phase 1             # Design contract (frontend phases)
/sdd-plan-phase 1           # Research + plan + verify
/sdd-execute-phase 1        # Parallel execution
/sdd-verify-work 1          # Manual UAT
/sdd-ship 1                 # Create PR from verified work
/sdd-ui-review 1            # Visual audit (frontend phases)
/clear
/sdd-next                   # Auto-detect and run next step
...
/sdd-audit-milestone        # Check everything shipped
/sdd-complete-milestone     # Archive, tag, done
/sdd-session-report         # Generate session summary
```

### New Project from Existing Document

```bash
/sdd-new-project --auto @prd.md   # Auto-runs research/requirements/roadmap from your doc
/clear
/sdd-discuss-phase 1               # Normal flow from here
```

### Existing Codebase

```bash
/sdd-map-codebase           # Analyze what exists (parallel agents)
/sdd-new-project            # Questions focus on what you're ADDING
# (normal phase workflow from here)
```

### Quick Bug Fix

```bash
/sdd-quick
> "Fix the login button not responding on mobile Safari"
```

### Resuming After a Break

```bash
/sdd-progress               # See where you left off and what's next
# or
/sdd-resume-work            # Full context restoration from last session
```

### Preparing for Release

```bash
/sdd-audit-milestone        # Check requirements coverage, detect stubs
/sdd-plan-milestone-gaps    # If audit found gaps, create phases to close them
/sdd-complete-milestone     # Archive, tag, done
```

### Speed vs Quality Presets

| Scenario | Mode | Granularity | Profile | Research | Plan Check | Verifier |
|----------|------|-------|---------|----------|------------|----------|
| Prototyping | `yolo` | `coarse` | `budget` | off | off | off |
| Normal dev | `interactive` | `standard` | `balanced` | on | on | on |
| Production | `interactive` | `fine` | `quality` | on | on | on |

**Skipping discuss-phase in autonomous mode:** When running in `yolo` mode with well-established preferences already captured in PROJECT.md, set `workflow.skip_discuss: true` via `/sdd-settings`. This bypasses the discuss-phase entirely and writes a minimal CONTEXT.md derived from the ROADMAP phase goal. Useful when your PROJECT.md and conventions are comprehensive enough that discussion adds no new information.

### Mid-Milestone Scope Changes

```bash
/sdd-add-phase              # Append a new phase to the roadmap
# or
/sdd-insert-phase 3         # Insert urgent work between phases 3 and 4
# or
/sdd-remove-phase 7         # Descope phase 7 and renumber
```

### Multi-Project Workspaces

Work on multiple repos or features in parallel with isolated SDD state.

```bash
# Create a workspace with repos from your monorepo
/sdd-new-workspace --name feature-b --repos hr-ui,ZeymoAPI

# Feature branch isolation — worktree of current repo with its own .planning/
/sdd-new-workspace --name feature-b --repos .

# Then cd into the workspace and initialize SDD
cd ~/sdd-workspaces/feature-b
/sdd-new-project

# List and manage workspaces
/sdd-list-workspaces
/sdd-remove-workspace feature-b
```

Each workspace gets:
- Its own `.planning/` directory (fully independent from source repos)
- Git worktrees (default) or clones of specified repos
- A `WORKSPACE.md` manifest tracking member repos

---

## Troubleshooting

### Programmatic CLI (`sdd-sdk query` vs `sdd-tools.cjs`)

For automation and copy-paste from docs, prefer **`sdd-sdk query`** with a registered subcommand (see [CLI-TOOLS.md](CLI-TOOLS.md) and [QUERY-HANDLERS.md](../sdk/src/query/QUERY-HANDLERS.md)). The legacy **`node $HOME/.claude/sdd/bin/sdd-tools.cjs`** CLI remains supported for dual-mode operation.

**Not yet on `sdd-sdk query` (use CJS):** `state validate`, `state sync`, `audit-open`, `graphify`, `from-gsd2`, and any subcommand not listed in the registry.

### STATE.md Out of Sync

If STATE.md shows incorrect phase status or position, use the state consistency commands (**CJS-only** until ported to the query layer):

```bash
node "$HOME/.claude/sdd/bin/sdd-tools.cjs" state validate          # Detect drift between STATE.md and filesystem
node "$HOME/.claude/sdd/bin/sdd-tools.cjs" state sync --verify     # Preview what sync would change
node "$HOME/.claude/sdd/bin/sdd-tools.cjs" state sync              # Reconstruct STATE.md from disk
```

These commands are new in v1.32 and replace manual STATE.md editing.

### Read-Before-Edit Infinite Retry Loop

Some non-Claude runtimes (Cline, Augment Code) may enter an infinite retry loop when an agent attempts to edit a file it hasn't read. The `sdd-read-before-edit.js` hook (v1.32) detects this pattern and advises reading the file first. If your runtime doesn't support PreToolUse hooks, add this to your project's `CLAUDE.md`:

```markdown
## Edit Safety Rule
Always read a file before editing it. Never call Edit or Write on a file you haven't read in this session.
```

### "Project already initialized"

You ran `/sdd-new-project` but `.planning/PROJECT.md` already exists. This is a safety check. If you want to start over, delete the `.planning/` directory first.

### Context Degradation During Long Sessions

Clear your context window between major commands: `/clear` in Claude Code. SDD is designed around fresh contexts -- every subagent gets a clean 200K window. If quality is dropping in the main session, clear and use `/sdd-resume-work` or `/sdd-progress` to restore state.

### Plans Seem Wrong or Misaligned

Run `/sdd-discuss-phase [N]` before planning. Most plan quality issues come from Claude making assumptions that `CONTEXT.md` would have prevented. You can also run `/sdd-list-phase-assumptions [N]` to see what Claude intends to do before committing to a plan.

### Discuss-Phase Uses Technical Jargon I Don't Understand

`/sdd-discuss-phase` adapts its language based on your `USER-PROFILE.md`. If the profile indicates a non-technical owner — `learning_style: guided`, `jargon` listed as a frustration trigger, or `explanation_depth: high-level` — gray area questions are automatically reframed in product-outcome language instead of implementation terminology.

To enable this: run `/sdd-profile-user` to generate your profile. The profile is stored at `~/.claude/sdd/USER-PROFILE.md` and is read automatically on every `/sdd-discuss-phase` invocation. No other configuration is required.

### Execution Fails or Produces Stubs

Check that the plan was not too ambitious. Plans should have 2-3 tasks maximum. If tasks are too large, they exceed what a single context window can produce reliably. Re-plan with smaller scope.

### Lost Track of Where You Are

Run `/sdd-progress`. It reads all state files and tells you exactly where you are and what to do next.

### Need to Change Something After Execution

Do not re-run `/sdd-execute-phase`. Use `/sdd-quick` for targeted fixes, or `/sdd-verify-work` to systematically identify and fix issues through UAT.

### Model Costs Too High

Switch to budget profile: `/sdd-set-profile budget`. Disable research and plan-check agents via `/sdd-settings` if the domain is familiar to you (or to Claude).

### Using Non-Claude Runtimes (Codex, OpenCode, Gemini CLI, Kilo)

If you installed SDD for a non-Claude runtime, the installer already configured model resolution so all agents use the runtime's default model. No manual setup is needed. Specifically, the installer sets `resolve_model_ids: "omit"` in your config, which tells SDD to skip Anthropic model ID resolution and let the runtime choose its own default model.

To assign different models to different agents on a non-Claude runtime, add `model_overrides` to `.planning/config.json` with fully-qualified model IDs that your runtime recognizes:

```json
{
  "resolve_model_ids": "omit",
  "model_overrides": {
    "sdd-planner": "o3",
    "sdd-executor": "o4-mini",
    "sdd-debugger": "o3"
  }
}
```

The installer auto-configures `resolve_model_ids: "omit"` for Gemini CLI, OpenCode, Kilo, and Codex. If you're manually setting up a non-Claude runtime, add it to `.planning/config.json` yourself.

See the [Configuration Reference](CONFIGURATION.md#non-claude-runtimes-codex-opencode-gemini-cli-kilo) for the full explanation.

### Installing for Cline

Cline uses a rules-based integration — SDD installs as `.clinerules` rather than slash commands.

```bash
# Global install (applies to all projects)
npx @bhargavvc/sdd-cc --cline --global

# Local install (this project only)
npx @bhargavvc/sdd-cc --cline --local
```

Global installs write to `~/.cline/`. Local installs write to `./.cline/`. No custom slash commands are registered — SDD rules are loaded automatically by Cline from the rules file.

### Installing for CodeBuddy

CodeBuddy uses a skills-based integration.

```bash
npx @bhargavvc/sdd-cc --codebuddy --global
```

Skills are installed to `~/.codebuddy/skills/sdd-*/SKILL.md`.

### Installing for Qwen Code

Qwen Code uses the same open skills standard as Claude Code 2.1.88+.

```bash
npx @bhargavvc/sdd-cc --qwen --global
```

Skills are installed to `~/.qwen/skills/sdd-*/SKILL.md`. Use the `QWEN_CONFIG_DIR` environment variable to override the default install path.

### Using Claude Code with Non-Anthropic Providers (OpenRouter, Local)

If SDD subagents call Anthropic models and you're paying through OpenRouter or a local provider, switch to the `inherit` profile: `/sdd-set-profile inherit`. This makes all agents use your current session model instead of specific Anthropic models. See also `/sdd-settings` → Model Profile → Inherit.

### Working on a Sensitive/Private Project

Set `commit_docs: false` during `/sdd-new-project` or via `/sdd-settings`. Add `.planning/` to your `.gitignore`. Planning artifacts stay local and never touch git.

### SDD Update Overwrote My Local Changes

Since v1.17, the installer backs up locally modified files to `sdd-local-patches/`. Run `/sdd-reapply-patches` to merge your changes back.

### Cannot Update via npm

If `npx @bhargavvc/sdd-cc` fails due to npm outages or network restrictions, see [docs/manual-update.md](manual-update.md) for a step-by-step manual update procedure that works without npm access.

### Workflow Diagnostics (`/sdd-forensics`)

When a workflow fails in a way that isn't obvious -- plans reference nonexistent files, execution produces unexpected results, or state seems corrupted -- run `/sdd-forensics` to generate a diagnostic report.

**What it checks:**
- Git history anomalies (orphaned commits, unexpected branch state, rebase artifacts)
- Artifact integrity (missing or malformed planning files, broken cross-references)
- State inconsistencies (ROADMAP status vs. actual file presence, config drift)

**Output:** A diagnostic report written to `.planning/forensics/` with findings and suggested remediation steps.

### Executor Subagent Gets "Permission denied" on Bash Commands

SDD's `sdd-executor` subagents need write-capable Bash access to a project's standard tooling — `git commit`, `bin/rails`, `bundle exec`, `npm run`, `uv run`, and similar commands. Claude Code's default `~/.claude/settings.json` only allows a narrow set of read-only git commands, so a fresh install will hit "Permission to use Bash has been denied" the first time an executor tries to make a commit or run a build tool.

**Fix: add the required patterns to `~/.claude/settings.json`.**

The patterns you need depend on your stack. Copy the block for your stack and add it to the `permissions.allow` array.

#### Required for all stacks (git + gh)

```json
"Bash(git add:*)",
"Bash(git commit:*)",
"Bash(git merge:*)",
"Bash(git worktree:*)",
"Bash(git rebase:*)",
"Bash(git reset:*)",
"Bash(git checkout:*)",
"Bash(git switch:*)",
"Bash(git restore:*)",
"Bash(git stash:*)",
"Bash(git rm:*)",
"Bash(git mv:*)",
"Bash(git fetch:*)",
"Bash(git cherry-pick:*)",
"Bash(git apply:*)",
"Bash(gh:*)"
```

#### Rails / Ruby

```json
"Bash(bin/rails:*)",
"Bash(bin/brakeman:*)",
"Bash(bin/bundler-audit:*)",
"Bash(bin/importmap:*)",
"Bash(bundle:*)",
"Bash(rubocop:*)",
"Bash(erb_lint:*)"
```

#### Python / uv

```json
"Bash(uv:*)",
"Bash(python:*)",
"Bash(pytest:*)",
"Bash(ruff:*)",
"Bash(mypy:*)"
```

#### Node / npm / pnpm / bun

```json
"Bash(npm:*)",
"Bash(npx:*)",
"Bash(pnpm:*)",
"Bash(bun:*)",
"Bash(node:*)"
```

#### Rust / Cargo

```json
"Bash(cargo:*)"
```

**Example `~/.claude/settings.json` snippet (Rails project):**

```json
{
  "permissions": {
    "allow": [
      "Write",
      "Edit",
      "Bash(git add:*)",
      "Bash(git commit:*)",
      "Bash(git merge:*)",
      "Bash(git worktree:*)",
      "Bash(git rebase:*)",
      "Bash(git reset:*)",
      "Bash(git checkout:*)",
      "Bash(git switch:*)",
      "Bash(git restore:*)",
      "Bash(git stash:*)",
      "Bash(git rm:*)",
      "Bash(git mv:*)",
      "Bash(git fetch:*)",
      "Bash(git cherry-pick:*)",
      "Bash(git apply:*)",
      "Bash(gh:*)",
      "Bash(bin/rails:*)",
      "Bash(bin/brakeman:*)",
      "Bash(bin/bundler-audit:*)",
      "Bash(bundle:*)",
      "Bash(rubocop:*)"
    ]
  }
}
```

**Per-project permissions (scoped to one repo):** If you prefer to allow these patterns for a single project rather than globally, add the same `permissions.allow` block to `.claude/settings.local.json` in your project root instead of `~/.claude/settings.json`. Claude Code checks project-local settings first.

**Interactive guidance:** When an executor is blocked mid-phase, it will identify the exact pattern needed (e.g. `"Bash(bin/rails:*)"`) so you can add it and re-run `/sdd-execute-phase`.

### Subagent Appears to Fail but Work Was Done

A known workaround exists for a Claude Code classification bug. SDD's orchestrators (execute-phase, quick) spot-check actual output before reporting failure. If you see a failure message but commits were made, check `git log` -- the work may have succeeded.

### Parallel Execution Causes Build Lock Errors

If you see pre-commit hook failures, cargo lock contention, or 30+ minute execution times during parallel wave execution, this is caused by multiple agents triggering build tools simultaneously. SDD handles this automatically since v1.26 — parallel agents use `--no-verify` on commits and the orchestrator runs hooks once after each wave. If you're on an older version, add this to your project's `CLAUDE.md`:

```markdown
## Git Commit Rules for Agents
All subagent/executor commits MUST use `--no-verify`.
```

To disable parallel execution entirely: `/sdd-settings` → set `parallelization.enabled` to `false`.

### Windows: Installation Crashes on Protected Directories

If the installer crashes with `EPERM: operation not permitted, scandir` on Windows, this is caused by OS-protected directories (e.g., Chromium browser profiles). Fixed since v1.24 — update to the latest version. As a workaround, temporarily rename the problematic directory before running the installer.

---

## Recovery Quick Reference

| Problem | Solution |
|---------|----------|
| Lost context / new session | `/sdd-resume-work` or `/sdd-progress` |
| Phase went wrong | `git revert` the phase commits, then re-plan |
| Need to change scope | `/sdd-add-phase`, `/sdd-insert-phase`, or `/sdd-remove-phase` |
| Milestone audit found gaps | `/sdd-plan-milestone-gaps` |
| Something broke | `/sdd-debug "description"` (add `--diagnose` for analysis without fixes) |
| STATE.md out of sync | `state validate` then `state sync` |
| Workflow state seems corrupted | `/sdd-forensics` |
| Quick targeted fix | `/sdd-quick` |
| Plan doesn't match your vision | `/sdd-discuss-phase [N]` then re-plan |
| Costs running high | `/sdd-set-profile budget` and `/sdd-settings` to toggle agents off |
| Update broke local changes | `/sdd-reapply-patches` |
| Want session summary for stakeholder | `/sdd-session-report` |
| Don't know what step is next | `/sdd-next` |
| Parallel execution build errors | Update SDD or set `parallelization.enabled: false` |

---

## Project File Structure

For reference, here is what SDD creates in your project:

```
.planning/
  PROJECT.md              # Project vision and context (always loaded)
  REQUIREMENTS.md         # Scoped v1/v2 requirements with IDs
  ROADMAP.md              # Phase breakdown with status tracking
  STATE.md                # Decisions, blockers, session memory
  config.json             # Workflow configuration
  MILESTONES.md           # Completed milestone archive
  HANDOFF.json            # Structured session handoff (from /sdd-pause-work)
  research/               # Domain research from /sdd-new-project
  reports/                # Session reports (from /sdd-session-report)
  todos/
    pending/              # Captured ideas awaiting work
    done/                 # Completed todos
  debug/                  # Active debug sessions
    resolved/             # Archived debug sessions
  spikes/                 # Feasibility experiments (from /sdd-spike)
    NNN-name/             # Experiment code + README with verdict
    MANIFEST.md           # Index of all spikes
  sketches/               # HTML mockups (from /sdd-sketch)
    NNN-name/             # index.html (2-3 variants) + README
    themes/
      default.css         # Shared CSS variables for all sketches
    MANIFEST.md           # Index of all sketches with winners
  codebase/               # Brownfield codebase mapping (from /sdd-map-codebase)
  phases/
    XX-phase-name/
      XX-YY-PLAN.md       # Atomic execution plans
      XX-YY-SUMMARY.md    # Execution outcomes and decisions
      CONTEXT.md          # Your implementation preferences
      RESEARCH.md         # Ecosystem research findings
      VERIFICATION.md     # Post-execution verification results
      XX-UI-SPEC.md       # UI design contract (from /sdd-ui-phase)
      XX-UI-REVIEW.md     # Visual audit scores (from /sdd-ui-review)
  ui-reviews/             # Screenshots from /sdd-ui-review (gitignored)
```
