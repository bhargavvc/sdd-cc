# SDD Shipped Surface Inventory

> Authoritative roster of every shipped SDD surface: commands, agents, workflows, references, CLI modules, and hooks. Where the broad docs (AGENTS.md, COMMANDS.md, ARCHITECTURE.md, CLI-TOOLS.md) diverge from the filesystem, treat this file and the repository tree itself as the source of truth.

## How To Use This File

- Counts here are derived from the filesystem at the v1.36.0 pin and may drift between releases. For live counts, run `ls commands/sdd/*.md | wc -l`, `ls agents/sdd-*.md | wc -l`, etc. against the checkout.
- This file enumerates every shipped surface across all six families (agents, commands, workflows, references, CLI modules, hooks). Broad docs may render narrative or curated subsets; when they disagree with the filesystem, this file and the directory listings are authoritative.
- New surfaces added after v1.36.0 should land here first, then propagate to the broad docs. The drift-control tests in `tests/inventory-counts.test.cjs`, `tests/commands-doc-parity.test.cjs`, `tests/agents-doc-parity.test.cjs`, `tests/cli-modules-doc-parity.test.cjs`, `tests/hooks-doc-parity.test.cjs`, `tests/architecture-counts.test.cjs`, and `tests/command-count-sync.test.cjs` anchor the counts and roster contents against the filesystem.

---

## Agents (33 shipped)

Full roster at `agents/sdd-*.md`. The "Primary doc" column flags whether [`docs/AGENTS.md`](AGENTS.md) carries a full role card (*primary*), a short stub in the "Advanced and Specialized Agents" section (*advanced stub*), or no coverage (*inventory only*).

| Agent | Role (one line) | Spawned by | Primary doc |
|-------|-----------------|------------|-------------|
| sdd-project-researcher | Researches domain ecosystem before roadmap creation (stack, features, architecture, pitfalls). | `/sdd-new-project`, `/sdd-new-milestone` | primary |
| sdd-phase-researcher | Researches implementation approach for a specific phase before planning. | `/sdd-plan-phase` | primary |
| sdd-ui-researcher | Produces UI design contracts for frontend phases. | `/sdd-ui-phase` | primary |
| sdd-assumptions-analyzer | Produces evidence-backed assumptions for discuss-phase (assumptions mode). | `discuss-phase-assumptions` workflow | primary |
| sdd-advisor-researcher | Researches a single gray-area decision during discuss-phase advisor mode. | `discuss-phase` workflow (advisor mode) | primary |
| sdd-research-synthesizer | Combines parallel researcher outputs into a unified SUMMARY.md. | `/sdd-new-project` | primary |
| sdd-planner | Creates executable phase plans with task breakdown and goal-backward verification. | `/sdd-plan-phase`, `/sdd-quick` | primary |
| sdd-roadmapper | Creates project roadmaps with phase breakdown and requirement mapping. | `/sdd-new-project` | primary |
| sdd-executor | Executes SDD plans with atomic commits and deviation handling. | `/sdd-execute-phase`, `/sdd-quick` | primary |
| sdd-plan-checker | Verifies plans will achieve phase goals (8 verification dimensions). | `/sdd-plan-phase` (verification loop) | primary |
| sdd-integration-checker | Verifies cross-phase integration and end-to-end flows. | `/sdd-audit-milestone` | primary |
| sdd-ui-checker | Validates UI-SPEC.md design contracts against quality dimensions. | `/sdd-ui-phase` (validation loop) | primary |
| sdd-verifier | Verifies phase goal achievement through goal-backward analysis. | `/sdd-execute-phase` | primary |
| sdd-nyquist-auditor | Fills Nyquist validation gaps by generating tests. | `/sdd-validate-phase` | primary |
| sdd-ui-auditor | Retroactive 6-pillar visual audit of implemented frontend code. | `/sdd-ui-review` | primary |
| sdd-codebase-mapper | Explores codebase and writes structured analysis documents. | `/sdd-map-codebase` | primary |
| sdd-debugger | Investigates bugs using scientific method with persistent state. | `/sdd-debug`, `/sdd-verify-work` | primary |
| sdd-user-profiler | Scores developer behavior across 8 dimensions. | `/sdd-profile-user` | primary |
| sdd-doc-writer | Writes and updates project documentation. | `/sdd-docs-update` | primary |
| sdd-doc-verifier | Verifies factual claims in generated documentation. | `/sdd-docs-update` | primary |
| sdd-security-auditor | Verifies threat mitigations from PLAN.md threat model. | `/sdd-secure-phase` | primary |
| sdd-pattern-mapper | Maps new files to closest existing analogs; writes PATTERNS.md for the planner. | `/sdd-plan-phase` (between research and planning) | advanced stub |
| sdd-debug-session-manager | Runs the full `/sdd-debug` checkpoint-and-continuation loop in isolated context so main stays lean. | `/sdd-debug` | advanced stub |
| sdd-code-reviewer | Reviews source files for bugs, security issues, and code-quality problems; produces REVIEW.md. | `/sdd-code-review` | advanced stub |
| sdd-code-fixer | Applies fixes to REVIEW.md findings with atomic per-fix commits; produces REVIEW-FIX.md. | `/sdd-code-review --fix` | advanced stub |
| sdd-ai-researcher | Researches a chosen AI framework's official docs into implementation-ready guidance (AI-SPEC.md §3–§4b). | `/sdd-ai-integration-phase` | advanced stub |
| sdd-domain-researcher | Surfaces domain-expert evaluation criteria and failure modes for an AI system (AI-SPEC.md §1b). | `/sdd-ai-integration-phase` | advanced stub |
| sdd-eval-planner | Designs structured evaluation strategy for an AI phase (AI-SPEC.md §5–§7). | `/sdd-ai-integration-phase` | advanced stub |
| sdd-eval-auditor | Retroactive audit of an AI phase's evaluation coverage; produces EVAL-REVIEW.md (COVERED/PARTIAL/MISSING). | `/sdd-eval-review` | advanced stub |
| sdd-framework-selector | ≤6-question interactive decision matrix that scores and recommends an AI/LLM framework. | `/sdd-ai-integration-phase` | advanced stub |
| sdd-intel-updater | Writes structured intel files (`.planning/intel/*.json`) used as a queryable codebase knowledge base. | `/sdd-map-codebase --query` | advanced stub |
| sdd-doc-classifier | Classifies a single planning document as ADR, PRD, SPEC, DOC, or UNKNOWN; spawned in parallel to process the doc corpus. | `/sdd-ingest-docs` | advanced stub |
| sdd-doc-synthesizer | Synthesizes classified planning docs into a single consolidated context with precedence rules, cycle detection, and three-bucket conflicts report. | `/sdd-ingest-docs` | advanced stub |

**Coverage note.** `docs/AGENTS.md` gives full role cards for 21 primary agents plus concise stubs for the 12 advanced agents. The Agent Tool Permissions Summary in that file covers only the primary 21 agents; the advanced agents' tool lists are captured in their per-agent frontmatter in `agents/sdd-*.md`.

---

## Commands (67 shipped)

Full roster at `commands/sdd/*.md`. The groupings below mirror `docs/COMMANDS.md` section order; each row carries the command name, a one-line role derived from the command's frontmatter `description:`, and a link to the source file. `tests/command-count-sync.test.cjs` locks the count against the filesystem.

### Namespace Meta-Skills

These six routers are descriptor-only entries that the model picks first; the body of each contains a routing table that points at the correct concrete sub-skill. They exist to keep the eager skill-listing token cost low while the full surface remains reachable. See [#2792](https://github.com/bhargavvc/sdd-cc/issues/2792) for the rationale; the routing tables target the post-[#2790](https://github.com/bhargavvc/sdd-cc/issues/2790) consolidated surface.

| Command | Role | Source |
|---------|------|--------|
| `/sdd-workflow` | Phase pipeline router — discuss / plan / execute / verify / phase / progress. | [commands/sdd/ns-workflow.md](../commands/sdd/ns-workflow.md) |
| `/sdd-project` | Project lifecycle router — milestones, audits, summary. | [commands/sdd/ns-project.md](../commands/sdd/ns-project.md) |
| `/sdd-quality` | Quality-gate router — code review, debug, audit, security, eval, ui. | [commands/sdd/ns-review.md](../commands/sdd/ns-review.md) |
| `/sdd-context` | Codebase-intelligence router — map, graphify, docs, learnings. | [commands/sdd/ns-context.md](../commands/sdd/ns-context.md) |
| `/sdd-manage` | Management router — config, workspace, workstreams, thread, update, ship, inbox. | [commands/sdd/ns-manage.md](../commands/sdd/ns-manage.md) |
| `/sdd-ideate` | Exploration & capture router — explore, sketch, spike, spec, capture. | [commands/sdd/ns-ideate.md](../commands/sdd/ns-ideate.md) |

### Core Workflow

| Command | Role | Source |
|---------|------|--------|
| `/sdd-new-project` | Initialize a new project with deep context gathering and PROJECT.md. | [commands/sdd/new-project.md](../commands/sdd/new-project.md) |
| `/sdd-workspace` | Manage SDD workspaces — create (`--new`), list (`--list`), or remove (`--remove`) isolated workspace environments. | [commands/sdd/workspace.md](../commands/sdd/workspace.md) |
| `/sdd-discuss-phase` | Gather phase context through adaptive questioning before planning. | [commands/sdd/discuss-phase.md](../commands/sdd/discuss-phase.md) |
| `/sdd-mvp-phase` | Plan a phase as a vertical MVP slice — user story, SPIDR splitting, then plan-phase. | [commands/sdd/mvp-phase.md](../commands/sdd/mvp-phase.md) |
| `/sdd-spec-phase` | Socratic spec refinement producing a SPEC.md with falsifiable requirements. | [commands/sdd/spec-phase.md](../commands/sdd/spec-phase.md) |
| `/sdd-ui-phase` | Generate UI design contract (UI-SPEC.md) for frontend phases. | [commands/sdd/ui-phase.md](../commands/sdd/ui-phase.md) |
| `/sdd-ai-integration-phase` | Generate AI design contract (AI-SPEC.md) via framework selection, research, and eval planning. | [commands/sdd/ai-integration-phase.md](../commands/sdd/ai-integration-phase.md) |
| `/sdd-plan-phase` | Create detailed phase plan (PLAN.md) with verification loop. | [commands/sdd/plan-phase.md](../commands/sdd/plan-phase.md) |
| `/sdd-plan-review-convergence` | Cross-AI plan convergence loop — replan with review feedback until no HIGH concerns remain (max 3 cycles). | [commands/sdd/plan-review-convergence.md](../commands/sdd/plan-review-convergence.md) |
| `/sdd-ultraplan-phase` | [BETA] Offload plan phase to Claude Code's ultraplan cloud — drafts remotely, review in browser, import back via `/sdd-import`. Claude Code only. | [commands/sdd/ultraplan-phase.md](../commands/sdd/ultraplan-phase.md) |
| `/sdd-spike` | Rapidly spike an idea with throwaway experiments; use `--wrap-up` to package findings as a persistent skill. | [commands/sdd/spike.md](../commands/sdd/spike.md) |
| `/sdd-sketch` | Rapidly sketch UI/design ideas using throwaway HTML mockups; use `--wrap-up` to package findings. | [commands/sdd/sketch.md](../commands/sdd/sketch.md) |
| `/sdd-execute-phase` | Execute all plans in a phase with wave-based parallelization. | [commands/sdd/execute-phase.md](../commands/sdd/execute-phase.md) |
| `/sdd-verify-work` | Validate built features through conversational UAT with auto-diagnosis. | [commands/sdd/verify-work.md](../commands/sdd/verify-work.md) |
| `/sdd-ship` | Create PR, run review, and prepare for merge after verification. | [commands/sdd/ship.md](../commands/sdd/ship.md) |
| `/sdd-fast` | Execute a trivial task inline — no subagents, no planning overhead. | [commands/sdd/fast.md](../commands/sdd/fast.md) |
| `/sdd-quick` | Execute a quick task with SDD guarantees (atomic commits, state tracking) but skip optional agents. | [commands/sdd/quick.md](../commands/sdd/quick.md) |
| `/sdd-ui-review` | Retroactive 6-pillar visual audit of implemented frontend code. | [commands/sdd/ui-review.md](../commands/sdd/ui-review.md) |
| `/sdd-code-review` | Review source files changed during a phase for bugs, security, and code-quality problems; use `--fix` to auto-apply findings. | [commands/sdd/code-review.md](../commands/sdd/code-review.md) |
| `/sdd-eval-review` | Retroactively audit an executed AI phase's evaluation coverage; produces EVAL-REVIEW.md. | [commands/sdd/eval-review.md](../commands/sdd/eval-review.md) |

### Phase & Milestone Management

| Command | Role | Source |
|---------|------|--------|
| `/sdd-phase` | CRUD for phases — add (default), insert (`--insert`), remove (`--remove`), or edit (`--edit`) phases in ROADMAP.md. | [commands/sdd/phase.md](../commands/sdd/phase.md) |
| `/sdd-add-tests` | Generate tests for a completed phase based on UAT criteria and implementation. | [commands/sdd/add-tests.md](../commands/sdd/add-tests.md) |
| `/sdd-validate-phase` | Retroactively audit and fill Nyquist validation gaps for a completed phase. | [commands/sdd/validate-phase.md](../commands/sdd/validate-phase.md) |
| `/sdd-secure-phase` | Retroactively verify threat mitigations for a completed phase. | [commands/sdd/secure-phase.md](../commands/sdd/secure-phase.md) |
| `/sdd-audit-milestone` | Audit milestone completion against original intent before archiving. | [commands/sdd/audit-milestone.md](../commands/sdd/audit-milestone.md) |
| `/sdd-audit-uat` | Cross-phase audit of all outstanding UAT and verification items. | [commands/sdd/audit-uat.md](../commands/sdd/audit-uat.md) |
| `/sdd-audit-fix` | Autonomous audit-to-fix pipeline — find issues, classify, fix, test, commit. | [commands/sdd/audit-fix.md](../commands/sdd/audit-fix.md) |
| `/sdd-complete-milestone` | Archive completed milestone and prepare for next version. | [commands/sdd/complete-milestone.md](../commands/sdd/complete-milestone.md) |
| `/sdd-new-milestone` | Start a new milestone cycle — update PROJECT.md and route to requirements. | [commands/sdd/new-milestone.md](../commands/sdd/new-milestone.md) |
| `/sdd-milestone-summary` | Generate a comprehensive project summary from milestone artifacts. | [commands/sdd/milestone-summary.md](../commands/sdd/milestone-summary.md) |
| `/sdd-cleanup` | Archive accumulated phase directories from completed milestones. | [commands/sdd/cleanup.md](../commands/sdd/cleanup.md) |
| `/sdd-manager` | Interactive command center for managing multiple phases from one terminal. | [commands/sdd/manager.md](../commands/sdd/manager.md) |
| `/sdd-workstreams` | Manage parallel workstreams — list, create, switch, status, progress, complete, resume. | [commands/sdd/workstreams.md](../commands/sdd/workstreams.md) |
| `/sdd-autonomous` | Run all remaining phases autonomously — discuss → plan → execute per phase. | [commands/sdd/autonomous.md](../commands/sdd/autonomous.md) |
| `/sdd-undo` | Safe git revert — roll back phase or plan commits using the phase manifest. | [commands/sdd/undo.md](../commands/sdd/undo.md) |

### Session & Navigation

| Command | Role | Source |
|---------|------|--------|
| `/sdd-progress` | Check project progress, show context, and route to next action; use `--next` to advance automatically or `--do` to run a freeform task. | [commands/sdd/progress.md](../commands/sdd/progress.md) |
| `/sdd-capture` | Capture ideas, tasks, notes, and seeds — todo (default), `--note`, `--backlog`, `--seed`, or `--list` pending todos. | [commands/sdd/capture.md](../commands/sdd/capture.md) |
| `/sdd-stats` | Display project statistics — phases, plans, requirements, git metrics, timeline. | [commands/sdd/stats.md](../commands/sdd/stats.md) |
| `/sdd-pause-work` | Create context handoff when pausing work mid-phase. | [commands/sdd/pause-work.md](../commands/sdd/pause-work.md) |
| `/sdd-resume-work` | Resume work from previous session with full context restoration. | [commands/sdd/resume-work.md](../commands/sdd/resume-work.md) |
| `/sdd-explore` | Socratic ideation and idea routing — think through ideas before committing. | [commands/sdd/explore.md](../commands/sdd/explore.md) |
| `/sdd-review-backlog` | Review and promote backlog items to active milestone. | [commands/sdd/review-backlog.md](../commands/sdd/review-backlog.md) |
| `/sdd-thread` | Manage persistent context threads for cross-session work. | [commands/sdd/thread.md](../commands/sdd/thread.md) |

### Codebase Intelligence

| Command | Role | Source |
|---------|------|--------|
| `/sdd-map-codebase` | Analyze codebase with parallel mapper agents; use `--fast` for lightweight scan or `--query` for intel queries. | [commands/sdd/map-codebase.md](../commands/sdd/map-codebase.md) |
| `/sdd-graphify` | Build, query, and inspect the project knowledge graph in `.planning/graphs/`. | [commands/sdd/graphify.md](../commands/sdd/graphify.md) |
| `/sdd-extract-learnings` | Extract decisions, lessons, patterns, and surprises from completed phase artifacts. | [commands/sdd/extract-learnings.md](../commands/sdd/extract-learnings.md) |

### Review, Debug & Recovery

| Command | Role | Source |
|---------|------|--------|
| `/sdd-review` | Request cross-AI peer review of phase plans from external AI CLIs. | [commands/sdd/review.md](../commands/sdd/review.md) |
| `/sdd-debug` | Systematic debugging with persistent state across context resets. | [commands/sdd/debug.md](../commands/sdd/debug.md) |
| `/sdd-forensics` | Post-mortem investigation for failed SDD workflows — analyzes git, artifacts, state. | [commands/sdd/forensics.md](../commands/sdd/forensics.md) |
| `/sdd-health` | Diagnose planning directory health and optionally repair issues. | [commands/sdd/health.md](../commands/sdd/health.md) |
| `/sdd-import` | Ingest external plans with conflict detection against project decisions. | [commands/sdd/import.md](../commands/sdd/import.md) |
| `/sdd-inbox` | Triage and review all open GitHub issues and PRs against project templates. | [commands/sdd/inbox.md](../commands/sdd/inbox.md) |

### Docs, Profile & Utilities

| Command | Role | Source |
|---------|------|--------|
| `/sdd-docs-update` | Generate or update project documentation verified against the codebase. | [commands/sdd/docs-update.md](../commands/sdd/docs-update.md) |
| `/sdd-ingest-docs` | Scan a repo for mixed ADRs/PRDs/SPECs/DOCs and bootstrap or merge the full `.planning/` setup with classification, synthesis, and conflicts report. | [commands/sdd/ingest-docs.md](../commands/sdd/ingest-docs.md) |
| `/sdd-profile-user` | Generate developer behavioral profile and Claude-discoverable artifacts. | [commands/sdd/profile-user.md](../commands/sdd/profile-user.md) |
| `/sdd-settings` | Configure SDD workflow toggles and model profile. | [commands/sdd/settings.md](../commands/sdd/settings.md) |
| `/sdd-config` | Configure SDD settings — workflow toggles (default), advanced knobs (`--advanced`), integrations (`--integrations`), or model profile (`--profile`). | [commands/sdd/config.md](../commands/sdd/config.md) |
| `/sdd-pr-branch` | Create a clean PR branch by filtering out `.planning/` commits. | [commands/sdd/pr-branch.md](../commands/sdd/pr-branch.md) |
| `/sdd-surface` | Toggle which skills are surfaced — apply a profile, list, or disable a cluster without reinstall. | [commands/sdd/surface.md](../commands/sdd/surface.md) |
| `/sdd-update` | Update SDD to latest version; use `--sync` to sync skills across runtimes or `--reapply` to reapply local patches. | [commands/sdd/update.md](../commands/sdd/update.md) |
| `/sdd-help` | Show available SDD commands and usage guide. | [commands/sdd/help.md](../commands/sdd/help.md) |

---

## Workflows (88 shipped)

Full roster at `sdd/workflows/*.md`. Workflows are thin orchestrators that commands reference internally; most are not read directly by end users. Rows below map each workflow file to its role (derived from the `<purpose>` block) and, where applicable, to the command that invokes it.

| Workflow | Role | Invoked by |
|----------|------|------------|
| `add-backlog.md` | Add a backlog item to ROADMAP.md using 999.x numbering. | `/sdd-capture --backlog` |
| `add-phase.md` | Add a new integer phase to the end of the current milestone in the roadmap. | `/sdd-phase` (default) |
| `add-tests.md` | Generate unit and E2E tests for a completed phase based on its artifacts. | `/sdd-add-tests` |
| `add-todo.md` | Capture an idea or task that surfaces during a session as a structured todo. | `/sdd-capture` (default) |
| `ai-integration-phase.md` | Orchestrate framework selection → AI research → domain research → eval planning into AI-SPEC.md. | `/sdd-ai-integration-phase` |
| `analyze-dependencies.md` | Analyze ROADMAP.md phases for file overlap and semantic dependencies; suggest `Depends on` edges. | `/sdd-manager --analyze-deps` |
| `audit-fix.md` | Autonomous audit-to-fix pipeline — run audit, parse, classify, fix, test, commit. | `/sdd-audit-fix` |
| `audit-milestone.md` | Verify milestone met its definition of done by aggregating phase verifications. | `/sdd-audit-milestone` |
| `audit-uat.md` | Cross-phase audit of UAT and verification files; produces prioritized outstanding-items list. | `/sdd-audit-uat` |
| `autonomous.md` | Drive milestone phases autonomously — all remaining, a range, or a single phase. | `/sdd-autonomous` |
| `check-todos.md` | List pending todos, allow selection, load context, and route to the appropriate action. | `/sdd-capture --list` |
| `cleanup.md` | Archive accumulated phase directories from completed milestones. | `/sdd-cleanup` |
| `code-review-fix.md` | Auto-fix issues from REVIEW.md via sdd-code-fixer with per-fix atomic commits. | `/sdd-code-review --fix` |
| `code-review.md` | Review phase source changes via sdd-code-reviewer; produces REVIEW.md. | `/sdd-code-review` |
| `complete-milestone.md` | Mark a shipped version as complete — MILESTONES.md entry, PROJECT.md evolution, tag. | `/sdd-complete-milestone` |
| `diagnose-issues.md` | Orchestrate parallel debug agents to investigate UAT gaps and find root causes. | `/sdd-verify-work` (auto-diagnosis) |
| `discovery-phase.md` | Execute discovery at the appropriate depth level. | `/sdd-new-project` (discovery path) |
| `discuss-phase-assumptions.md` | Assumptions-mode discuss — extract implementation decisions via codebase-first analysis. | `/sdd-discuss-phase` (when `discuss_mode=assumptions`) |
| `discuss-phase-power.md` | Power-user discuss — pre-generate all questions into a JSON state file + HTML UI. | `/sdd-discuss-phase --power` |
| `discuss-phase.md` | Extract implementation decisions through iterative gray-area discussion. | `/sdd-discuss-phase` |
| `mvp-phase.md` | Plan a phase as a vertical MVP slice — user story, SPIDR splitting, then plan-phase. | `/sdd-mvp-phase` |
| `do.md` | Route freeform text from the user to the best matching SDD command. | `/sdd-progress --do` |
| `docs-update.md` | Generate, update, and verify canonical and hand-written project documentation. | `/sdd-docs-update` |
| `edit-phase.md` | Edit any field of an existing phase in ROADMAP.md in place, preserving number and position. | `/sdd-phase --edit` |
| `eval-review.md` | Retroactive audit of an implemented AI phase's evaluation coverage. | `/sdd-eval-review` |
| `execute-phase.md` | Execute all plans in a phase using wave-based parallel execution. | `/sdd-execute-phase` |
| `execute-plan.md` | Execute a phase prompt (PLAN.md) and create the outcome summary (SUMMARY.md). | `execute-phase.md` (per-plan subagent) |
| `explore.md` | Socratic ideation — guide the developer through probing questions. | `/sdd-explore` |
| `debug.md` | Systematic debugging — subcommand routing, session creation, delegation to sdd-debug-session-manager. | `/sdd-debug` |
| `extract-learnings.md` | Extract decisions, lessons, patterns, and surprises from completed phase artifacts. | `/sdd-extract-learnings` |
| `fast.md` | Execute a trivial task inline without subagent overhead. | `/sdd-fast` |
| `forensics.md` | Forensics investigation of failed workflows — git, artifacts, and state analysis. | `/sdd-forensics` |
| `graduation.md` | Cluster recurring LEARNINGS.md items across phases and surface HITL promotion candidates. | `transition.md` (graduation_scan step) |
| `health.md` | Validate `.planning/` directory integrity and report actionable issues. | `/sdd-health` |
| `help.md` | Display the complete SDD command reference. | `/sdd-help` |
| `import.md` | Ingest external plans with conflict detection against existing project decisions. | `/sdd-import` |
| `inbox.md` | Triage open GitHub issues and PRs against project contribution templates. | `/sdd-inbox` |
| `ingest-docs.md` | Scan a repo for mixed planning docs; classify, synthesize, and bootstrap or merge into `.planning/` with a conflicts report. | `/sdd-ingest-docs` |
| `insert-phase.md` | Insert a decimal phase for urgent work discovered mid-milestone. | `/sdd-phase --insert` |
| `list-phase-assumptions.md` | Surface Claude's assumptions about a phase before planning. | `/sdd-discuss-phase --assumptions` |
| `list-workspaces.md` | List all SDD workspaces found in `~/sdd-workspaces/` with their status. | `/sdd-workspace --list` |
| `manager.md` | Interactive milestone command center — dashboard, inline discuss, background plan/execute. | `/sdd-manager` |
| `map-codebase.md` | Orchestrate parallel codebase mapper agents to produce `.planning/codebase/` docs. | `/sdd-map-codebase` |
| `milestone-summary.md` | Milestone summary synthesis — onboarding and review artifact from milestone artifacts. | `/sdd-milestone-summary` |
| `new-milestone.md` | Start a new milestone cycle — load project context, gather goals, update PROJECT.md/STATE.md. | `/sdd-new-milestone` |
| `new-project.md` | Unified new-project flow — questioning, research (optional), requirements, roadmap. | `/sdd-new-project` |
| `new-workspace.md` | Create an isolated workspace with repo worktrees/clones and an independent `.planning/`. | `/sdd-workspace --new` |
| `next.md` | Detect current project state and automatically advance to the next logical step. | `/sdd-progress --next` |
| `node-repair.md` | Autonomous repair operator for failed task verification; invoked by `execute-plan`. | `execute-plan.md` (recovery) |
| `note.md` | Zero-friction idea capture — one Write call, one confirmation line. | `/sdd-capture --note` |
| `pause-work.md` | Create structured `.planning/HANDOFF.json` and `.continue-here.md` handoff files. | `/sdd-pause-work` |
| `plan-phase.md` | Create executable PLAN.md files with integrated research and verification loop. | `/sdd-plan-phase`, `/sdd-quick` |
| `plan-review-convergence.md` | Cross-AI plan convergence loop — replan with review feedback until no HIGH concerns remain. | `/sdd-plan-review-convergence` |
| `plant-seed.md` | Capture a forward-looking idea as a structured seed file with trigger conditions. | `/sdd-capture --seed` |
| `pr-branch.md` | Create a clean branch for pull requests by filtering `.planning/` commits. | `/sdd-pr-branch` |
| `profile-user.md` | Orchestrate the full developer profiling flow — consent, session scan, profile generation. | `/sdd-profile-user` |
| `progress.md` | Progress rendering — project context, position, and next-action routing. | `/sdd-progress` |
| `quick.md` | Quick-task execution with SDD guarantees (atomic commits, state tracking). | `/sdd-quick` |
| `reapply-patches.md` | Reapply local modifications after a SDD update. | `/sdd-update --reapply` |
| `remove-phase.md` | Remove a future phase from the roadmap and renumber subsequent phases. | `/sdd-phase --remove` |
| `remove-workspace.md` | Remove a SDD workspace and clean up worktrees. | `/sdd-workspace --remove` |
| `resume-project.md` | Resume work — restore full context from STATE.md, HANDOFF.json, and artifacts. | `/sdd-resume-work` |
| `review.md` | Cross-AI plan review via external CLIs; produces REVIEWS.md. | `/sdd-review` |
| `scan.md` | Rapid single-focus codebase scan — lightweight alternative to map-codebase. | `/sdd-map-codebase --fast` |
| `secure-phase.md` | Retroactive threat-mitigation audit for a completed phase. | `/sdd-secure-phase` |
| `session-report.md` | Session report — token usage, work summary, outcomes. | `/sdd-pause-work --report` |
| `settings.md` | Configure SDD workflow toggles and model profile. | `/sdd-settings`, `/sdd-config --profile` |
| `settings-advanced.md` | Configure SDD power-user knobs — plan bounce, timeouts, branch templates, cross-AI execution, runtime knobs. | `/sdd-config --advanced` |
| `settings-integrations.md` | Configure third-party API keys (Brave/Firecrawl/Exa), `review.models.<cli>` CLI routing, and `agent_skills.<agent-type>` injection with masked (`****<last-4>`) display. | `/sdd-config --integrations` |
| `ship.md` | Create PR, run review, and prepare for merge after verification. | `/sdd-ship` |
| `sketch.md` | Explore design directions through throwaway HTML mockups with 2-3 variants per sketch. | `/sdd-sketch` |
| `sketch-wrap-up.md` | Curate sketch findings and package them as a persistent `sketch-findings-[project]` skill. | `/sdd-sketch --wrap-up` |
| `spec-phase.md` | Socratic spec refinement with ambiguity scoring; produces SPEC.md. | `/sdd-spec-phase` |
| `spike.md` | Rapid feasibility validation through focused, throwaway experiments. | `/sdd-spike` |
| `spike-wrap-up.md` | Curate spike findings and package them as a persistent `spike-findings-[project]` skill. | `/sdd-spike --wrap-up` |
| `stats.md` | Project statistics rendering — phases, plans, requirements, git metrics. | `/sdd-stats` |
| `sync-skills.md` | Cross-runtime SDD skill sync — diff and apply `sdd-*` skill directories across runtime roots. | `/sdd-update --sync` |
| `transition.md` | Phase-boundary transition workflow — workstream checks, state advancement. | `execute-phase.md`, `/sdd-progress --next` |
| `ui-phase.md` | Generate UI-SPEC.md design contract via sdd-ui-researcher. | `/sdd-ui-phase` |
| `ui-review.md` | Retroactive 6-pillar visual audit via sdd-ui-auditor. | `/sdd-ui-review` |
| `ultraplan-phase.md` | [BETA] Offload planning to Claude Code's ultraplan cloud; drafts remotely and imports back via `/sdd-import`. | `/sdd-ultraplan-phase` |
| `undo.md` | Safe git revert — phase or plan commits using the phase manifest. | `/sdd-undo` |
| `thread.md` | Create, list, close, or resume persistent context threads for cross-session work. | `/sdd-thread` |
| `update.md` | Update SDD to latest version with changelog display. | `/sdd-update` |
| `validate-phase.md` | Retroactively audit and fill Nyquist validation gaps for a completed phase. | `/sdd-validate-phase` |
| `verify-phase.md` | Verify phase goal achievement through goal-backward analysis. | `execute-phase.md` (post-execution) |
| `verify-work.md` | Conversational UAT with auto-diagnosis — produces UAT.md and fix plans. | `/sdd-verify-work` |

> **Note:** Some workflows have no direct user-facing command (e.g. `execute-plan.md`, `verify-phase.md`, `transition.md`, `node-repair.md`, `diagnose-issues.md`) — they are invoked internally by orchestrator workflows. `discovery-phase.md` is an alternate entry for `/sdd-new-project`.

---

## References (60 shipped)

Full roster at `sdd/references/*.md`. References are shared knowledge documents that workflows and agents `@-reference`. The groupings below match [`docs/ARCHITECTURE.md`](ARCHITECTURE.md#references-sddreferencesmd) — core, workflow, thinking-model clusters, and the modular planner decomposition.

### Core References

| Reference | Role |
|-----------|------|
| `checkpoints.md` | Checkpoint type definitions and interaction patterns. |
| `gates.md` | 4 canonical gate types (Confirm, Quality, Safety, Transition) wired into plan-checker and verifier. |
| `model-profiles.md` | Per-agent model tier assignments. |
| `model-profile-resolution.md` | Model resolution algorithm documentation. |
| `verification-patterns.md` | How to verify different artifact types. |
| `verification-overrides.md` | Per-artifact verification override rules. |
| `planning-config.md` | Full config schema and behavior. |
| `git-integration.md` | Git commit, branching, and history patterns. |
| `git-planning-commit.md` | Planning directory commit conventions. |
| `questioning.md` | Dream-extraction philosophy for project initialization. |
| `tdd.md` | Test-driven development integration patterns. |
| `ui-brand.md` | Visual output formatting patterns. |
| `common-bug-patterns.md` | Common bug patterns for code review and verification. |
| `debugger-philosophy.md` | Evergreen debugging disciplines loaded by `sdd-debugger`. |
| `mandatory-initial-read.md` | Shared required-reading boilerplate injected into agent prompts. |
| `project-skills-discovery.md` | Shared project-skills-discovery boilerplate injected into agent prompts. |

### Workflow References

| Reference | Role |
|-----------|------|
| `agent-contracts.md` | Formal interface between orchestrators and agents. |
| `context-budget.md` | Context window budget allocation rules. |
| `continuation-format.md` | Session continuation/resume format. |
| `domain-probes.md` | Domain-specific probing questions for discuss-phase. |
| `gate-prompts.md` | Gate/checkpoint prompt templates. |
| `scout-codebase.md` | Phase-type→codebase-map selection table for discuss-phase scout step (extracted via #2551). |
| `revision-loop.md` | Plan revision iteration patterns. |
| `universal-anti-patterns.md` | Universal anti-patterns to detect and avoid. |
| `worktree-path-safety.md` | Worktree guard suite: HEAD assertion, cwd-drift sentinel (step 0a, #3097), and absolute-path guard (step 0b, #3099) — loaded into executor spawn prompts via `<execution_context>`. |
| `artifact-types.md` | Planning artifact type definitions. |
| `phase-argument-parsing.md` | Phase argument parsing conventions. |
| `decimal-phase-calculation.md` | Decimal sub-phase numbering rules. |
| `workstream-flag.md` | Workstream active-pointer conventions (`--ws`). |
| `user-profiling.md` | User behavioral profiling detection heuristics. |
| `thinking-partner.md` | Conditional thinking-partner activation at decision points. |
| `autonomous-smart-discuss.md` | Smart-discuss logic for autonomous mode. |
| `ios-scaffold.md` | iOS application scaffolding patterns. |
| `ai-evals.md` | AI evaluation design reference for `/sdd-ai-integration-phase`. |
| `ai-frameworks.md` | AI framework decision-matrix reference for `sdd-framework-selector`. |
| `executor-examples.md` | Worked examples for the sdd-executor agent. |
| `doc-conflict-engine.md` | Shared conflict-detection contract for ingest/import workflows. |
| `execute-mvp-tdd.md` | Runtime gate semantics for execute-phase under MVP+TDD — pre-task failing-test verification, end-of-phase blocking review. |
| `verify-mvp-mode.md` | UAT framing rules for MVP-mode phases — user-flow-first ordering, deferred technical checks, user-story-format guard. |

### Sketch References

References consumed by the `/sdd-sketch` workflow and its wrap-up companion.

| Reference | Role |
|-----------|------|
| `sketch-interactivity.md` | Rules for making HTML sketches feel interactive and alive. |
| `sketch-theme-system.md` | Shared CSS theme variable system for cross-sketch consistency. |
| `sketch-tooling.md` | Floating toolbar utilities included in every sketch. |
| `sketch-variant-patterns.md` | Multi-variant HTML patterns (tabs, side-by-side, overlays). |

### Thinking-Model References

References for integrating thinking-class models (o3, o4-mini, Gemini 2.5 Pro) into SDD workflows.

| Reference | Role |
|-----------|------|
| `thinking-models-debug.md` | Thinking-model patterns for debug workflows. |
| `thinking-models-execution.md` | Thinking-model patterns for execution agents. |
| `thinking-models-planning.md` | Thinking-model patterns for planning agents. |
| `thinking-models-research.md` | Thinking-model patterns for research agents. |
| `thinking-models-verification.md` | Thinking-model patterns for verification agents. |

### Modular Planner Decomposition

The `sdd-planner` agent is decomposed into a core agent plus reference modules to fit runtime character limits.

| Reference | Role |
|-----------|------|
| `planner-antipatterns.md` | Planner anti-patterns and specificity examples. |
| `planner-chunked.md` | Chunked mode return formats (`## OUTLINE COMPLETE`, `## PLAN COMPLETE`) for Windows stdio hang mitigation. |
| `planner-gap-closure.md` | Gap-closure mode behavior (reads VERIFICATION.md, targeted replanning). |
| `planner-reviews.md` | Cross-AI review integration (reads REVIEWS.md from `/sdd-review`). |
| `planner-revision.md` | Plan revision patterns for iterative refinement. |
| `planner-source-audit.md` | Planner source-audit and authority-limit rules. |
| `planner-mvp-mode.md` | Vertical-slice planning rules for MVP mode. |
| `planner-human-verify-mode.md` | Rules for `workflow.human_verify_mode = end-of-phase`: suppress `checkpoint:human-verify` task emission and route deferred items via `<verify><human-check>`. |
| `skeleton-template.md` | SKELETON.md template emitted for new-project Walking Skeleton (Phase 1 + `--mvp`). |
| `user-story-template.md` | User story format for MVP planning — "As a / I want to / So that" structured fields. |
| `spidr-splitting.md` | SPIDR splitting decomposition rules for handling large user stories in MVP mode. |

> **Subdirectory:** `sdd/references/few-shot-examples/` contains additional few-shot examples (`plan-checker.md`, `verifier.md`) that are referenced from specific agents. These are not counted in the 60 top-level references.

---

## CLI Modules (60 shipped)

Full listing: `sdd/bin/lib/*.cjs`.

| Module | Responsibility |
|--------|----------------|
| `active-workstream-store.cjs` | Workstream source precedence and selection (CLI `--ws` > `SDD_WORKSTREAM` env > stored pointer); name validation and environment propagation |
| `adr-parser.cjs` | ADR decision parser for plan-phase ingest express path; normalizes section synonyms, parses status/decision/scope fences, and enforces status rejection gates |
| `artifacts.cjs` | Canonical artifact registry — known `.planning/` root file names; used by `sdd-health` W019 lint |
| `audit.cjs` | Audit dispatch, audit open sessions, audit storage helpers |
| `cjs-command-router-adapter.cjs` | Shared compatibility adapter for manifest-backed CJS command-family routers |
| `clusters.cjs` | Skill cluster definitions for the runtime surface module (ADR-0011 Phase 2) |
| `command-aliases.generated.cjs` | Generated CJS alias/subcommand metadata for manifest-backed family routers |
| `commands.cjs` | Misc CLI commands (slug, timestamp, todos, scaffolding, stats) |
| `config-schema.cjs` | Single source of truth for `VALID_CONFIG_KEYS` and dynamic key patterns; imported by both the validator and the config-schema-docs parity test |
| `config.cjs` | `config.json` read/write, section initialization; imports validator from `config-schema.cjs` |
| `context-utilization.cjs` | Pure classifier for `sdd-health --context` — turns (tokensUsed, contextWindow) into a `{ percent, state }` triage result against the 60%/70% fracture-point thresholds (#2792) |
| `core.cjs` | Error handling, output formatting, shared utilities, runtime fallbacks; compatibility re-exports for planning-workspace helpers |
| `decisions.cjs` | Shared parser for CONTEXT.md `<decisions>` blocks (D-NN entries); used by `gap-checker.cjs` and intended for #2492 plan/verify decision gates |
| `docs.cjs` | Docs-update workflow init, Markdown scanning, monorepo detection |
| `drift.cjs` | Post-execute codebase structural drift detector (#2003): classifies file changes into new-dir/barrel/migration/route categories and round-trips `last_mapped_commit` frontmatter |
| `fallow-runner.cjs` | Fallow audit adapter for `/sdd-code-review`: binary resolution (`PATH` then `node_modules/.bin`), actionable missing-binary errors, and structural findings normalization |
| `frontmatter.cjs` | YAML frontmatter CRUD operations |
| `gap-checker.cjs` | Post-planning gap analysis (#2493): unified REQUIREMENTS.md + CONTEXT.md decisions vs PLAN.md coverage report (`sdd-tools gap-analysis`) |
| `graphify.cjs` | Knowledge-graph build/query/status/diff for `/sdd-graphify` |
| `gsd2-import.cjs` | External-plan ingest for `/sdd-import --from-gsd2` |
| `init-command-router.cjs` | Thin CJS subcommand router adapter for `sdd-tools init` |
| `init.cjs` | Compound context loading for each workflow type |
| `install-profiles.cjs` | Install profile allowlist + skill staging for `--minimal` install (#2762); single source of truth for which `sdd-*` skills/agents land in runtime config dirs |
| `installer-migration-authoring.cjs` | Installer migration authoring guardrails for record metadata, explicit scopes, ownership evidence, and runtime contract citations |
| `installer-migration-report.cjs` | Installer migration report projection and blocked-action guard for install/update integration |
| `installer-migrations.cjs` | Installer migration planning, artifact classification, install-state persistence, journaled apply, and rollback helpers |
| `intel.cjs` | Codebase intel store backing `/sdd-map-codebase --query` and `sdd-intel-updater` |
| `learnings.cjs` | Cross-phase learnings extraction for `/sdd-extract-learnings` |
| `milestone.cjs` | Milestone archival, requirements marking |
| `model-catalog.cjs` | CJS adapter over the shared model catalog JSON; exports canonical runtime tier defaults, agent profile maps, alias maps, and routing metadata for all CLI consumers |
| `model-profiles.cjs` | Backward-compatible profile helpers derived from `model-catalog.cjs`; no longer owns its own model table |
| `phase-command-router.cjs` | Thin CJS subcommand router adapter for `sdd-tools phase` |
| `phase.cjs` | Phase directory operations, decimal numbering, plan indexing |
| `phases-command-router.cjs` | Thin CJS subcommand router adapter for `sdd-tools phases` |
| `plan-scan.cjs` | Canonical phase-plan scanner — shared helper for detecting plan and summary files in flat and nested layouts (k014); consumed by state, roadmap, init, and workstream inventory paths |
| `planning-workspace.cjs` | Planning path/workstream seam (`planningDir`, `planningPaths`, active-workstream routing, `.planning/.lock` orchestration) |
| `profile-output.cjs` | Profile rendering, USER-PROFILE.md and dev-preferences.md generation |
| `profile-pipeline.cjs` | User behavioral profiling data pipeline, session file scanning |
| `review-reviewer-selection.cjs` | Reviewer selection/normalization helpers for `/sdd-review` default reviewer policy and precedence |
| `roadmap-command-router.cjs` | Thin CJS subcommand router adapter for `sdd-tools roadmap` |
| `roadmap.cjs` | ROADMAP.md parsing, phase extraction, plan progress |
| `runtime-homes.cjs` | Canonical runtime → global config/skills directory mapping; first-class support for all 15 runtimes including Hermes nested layout and Cline rules-based exclusion (#3126) |
| `schema-detect.cjs` | Schema-drift detection for ORM patterns (Prisma, Drizzle, etc.) |
| `secrets.cjs` | Secret-config masking convention (`****<last-4>`) for integration keys managed by `/sdd-config --integrations` — keeps plaintext out of `config-set` output |
| `security.cjs` | Path traversal prevention, prompt injection detection, safe JSON/shell helpers |
| `shell-command-projection.cjs` | Runtime-aware shell command projection for managed hook serialization: decides PowerShell call-operator usage by runtime/platform and normalizes Windows script path tokens |
| `state-command-router.cjs` | Thin CJS subcommand router adapter for `sdd-tools state` |
| `state.cjs` | STATE.md parsing, updating, progression, metrics |
| `state-document.cjs` | Pure STATE.md field extraction, replacement, status normalization, and progress calculation transforms |
| `state-document.generated.cjs` | GENERATED — CJS artifact emitted from `sdk/src/query/state-document.ts` via `sdk/scripts/gen-state-document.ts`; do not edit directly |
| `surface.cjs` | Runtime surface module — manages the runtime enable/disable surface state independently of the install-time profile marker (ADR-0011 Phase 2) |
| `template.cjs` | Template selection and filling with variable substitution |
| `uat.cjs` | UAT file parsing, verification debt tracking, audit-uat support |
| `validate-command-router.cjs` | Thin CJS subcommand router adapter for `sdd-tools validate` |
| `verify-command-router.cjs` | Thin CJS subcommand router adapter for `sdd-tools verify` |
| `verify.cjs` | Plan structure, phase completeness, reference, commit validation |
| `workstream-inventory.cjs` | Shared workstream inventory projection: state fields, phase/plan/summary counts, roadmap phase count, and active marker |
| `workstream-name-policy.cjs` | Canonical workstream name validation (`isValidActiveWorkstreamName`) and slug normalization (`toWorkstreamSlug`); shared by all workstream callers |
| `workstream.cjs` | Workstream CRUD, migration, session-scoped active pointer |
| `worktree-safety.cjs` | Worktree-root resolution and non-destructive prune policy decisions; owns W017 health-check logic |

[`docs/CLI-TOOLS.md`](CLI-TOOLS.md) may describe a subset of these modules; when it disagrees with the filesystem, this table and the directory listing are authoritative.

---

## Hooks (12 shipped)

Full listing: `hooks/`.

| Hook | Event | Purpose |
|------|-------|---------|
| `sdd-statusline.js` | `statusLine` | Displays model, task, directory, context usage |
| `sdd-context-monitor.js` | `PostToolUse` / `AfterTool` | Injects agent-facing context warnings at 35%/25% remaining |
| `sdd-check-update.js` | `SessionStart` | Background check for new SDD versions |
| `sdd-check-update-worker.js` | (worker) | Background worker helper for check-update |
| `sdd-update-banner.js` | `SessionStart` | Opt-in banner surfacing update availability when SDD statusline isn't used (PR #2795) |
| `sdd-prompt-guard.js` | `PreToolUse` | Scans `.planning/` writes for prompt-injection patterns (advisory) |
| `sdd-workflow-guard.js` | `PreToolUse` | Detects file edits outside SDD workflow context (advisory, opt-in) |
| `sdd-read-guard.js` | `PreToolUse` | Advisory guard preventing Edit/Write on unread files |
| `sdd-read-injection-scanner.js` | `PostToolUse` | Scans tool Read results for prompt-injection patterns (v1.36+, PR #2201) |
| `sdd-session-state.sh` | `PostToolUse` | Session-state tracking for shell-based runtimes |
| `sdd-validate-commit.sh` | `PostToolUse` | Commit validation for conventional-commit enforcement |
| `sdd-phase-boundary.sh` | `PostToolUse` | Phase-boundary detection for workflow transitions |

---

## Maintenance

- When a new command, agent, workflow, reference, CLI module, or hook ships, update the corresponding section here before the release is cut.
- The drift-guard tests under `tests/` (see "How To Use This File" above) assert that every shipped file is enumerated in this inventory. A new file without a matching row here will fail CI.
- When the filesystem diverges from `docs/ARCHITECTURE.md` counts or from curated-subset docs (e.g. `docs/AGENTS.md`'s primary roster), this file is the source of truth.
