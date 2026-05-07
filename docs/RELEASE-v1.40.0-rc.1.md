# v1.40.0-rc.1 Release Notes

Pre-release candidate. Published to npm under the `next` tag.

```bash
npx @bhargavvc/sdd-cc@next
```

---

## What's in this release

rc.1 opens the 1.40.0 train. The headline change is the **skill-surface
consolidation** ([#2790](https://github.com/bhargavvc/sdd-cc/issues/2790))
and the new **two-stage hierarchical routing** that sits on top of it
([#2792](https://github.com/bhargavvc/sdd-cc/issues/2792)) — together
they take the cold-start system-prompt overhead from listing 86 flat skills
down to 6 namespace routers. The release also adds the read-side of the
phase-lifecycle status-line, hardens the multi-runtime install converters,
and clears a backlog of small correctness fixes against Gemini, Copilot,
Codex, and the canary publish workflow.

### Added

- **Six namespace meta-skills with keyword-tag descriptions**
  ([#2792](https://github.com/bhargavvc/sdd-cc/issues/2792)) — replace
  the flat eager skill listing with a two-stage hierarchical routing layer.
  The model sees 6 namespace routers instead of 86 entries, selects a
  namespace, then routes to the sub-skill. Namespaces:
  `sdd:workflow` (phase pipeline), `sdd:project` (project lifecycle),
  `sdd:review` (quality gates), `sdd:context` (codebase intelligence),
  `sdd:manage` (config / workspace / workstreams), `sdd:ideate`
  (exploration / capture). Descriptions use pipe-separated keyword tags
  (≤ 60 chars) per the Tool Attention research showing keyword-dense tags
  outperform prose for routing at ~40% the token cost.

  | | Entries | Approx tokens |
  |---|---|---|
  | Pre-1.40 full install | 86 | ~2,150 |
  | Namespace meta-skills | 6 | ~120 |

  Existing sub-skills are unchanged and still invocable directly — the
  namespace skills are additive.

- **`/sdd-health --context` utilization guard**
  ([#2792](https://github.com/bhargavvc/sdd-cc/issues/2792)) — adds a
  context-window quality guard with two thresholds: 60 % utilization warns
  ("consider `/sdd-thread`"), 70 % is critical ("reasoning quality may
  degrade"; matches the fracture-point per recent context-attention
  research). Exposed via `/sdd-health --context` and as a structured
  `sdd-tools validate context` command for status-line / hook callers.

- **Phase-lifecycle status-line — read-side**
  ([#2833](https://github.com/bhargavvc/sdd-cc/issues/2833)) —
  `parseStateMd()` now reads four new STATE.md frontmatter fields:
  `active_phase` (phase number when orchestrator is in-flight),
  `next_action` (recommended next command when idle), `next_phases` (YAML
  flow array of next phase numbers), and `progress` (nested
  completed/total/percent block). `formatSddState()` gains scenes for
  in-flight, idle, and progress display. All fields default to undefined,
  so existing STATE.md files keep rendering as before. Write-side and
  status-line wiring follow in a later RC.

### Changed

- **Skill surface consolidated 86 → 59 `commands/sdd/*.md` entries**
  ([#2790](https://github.com/bhargavvc/sdd-cc/issues/2790)) — four
  new grouped skills replace clusters of micro-skills:
  - `capture` — folds add-todo (default), note (`--note`), add-backlog
    (`--backlog`), plant-seed (`--seed`), check-todos (`--list`)
  - `phase` — folds add-phase (default), insert-phase (`--insert`),
    remove-phase (`--remove`), edit-phase (`--edit`)
  - `config` — folds settings-advanced (`--advanced`),
    settings-integrations (`--integrations`), set-profile (`--profile`)
  - `workspace` — folds new-workspace (`--new`), list-workspaces
    (`--list`), remove-workspace (`--remove`)

  Six existing parents absorb wrap-up and sub-operations as flags:
  `update --sync / --reapply`, `sketch --wrap-up`, `spike --wrap-up`,
  `map-codebase --fast / --query`, `code-review --fix`,
  `progress --do / --next`. Zero functional loss — every removed
  micro-skill's behavior survives via a flag on a consolidated parent.
  31 micro-skills deleted outright; `autonomous.md` corrected to call
  `sdd:code-review --fix` (was invoking deleted `sdd:code-review-fix`).

- **Canary release workflow now publishes from `dev` branch only**
  ([#2868](https://github.com/bhargavvc/sdd-cc/issues/2868)) —
  `.github/workflows/canary.yml` swaps its four publish-step guards from
  `refs/heads/main` to `refs/heads/dev`, aligning with the new branch →
  dist-tag policy (`dev` → `@canary`, `main` → `@next` / `@latest`).
  `workflow_dispatch` runs on `main` (or any other branch) now complete
  build / test / dry-run validation but skip publish + tag, instead of the
  prior behaviour where `main` published and `dev` silently no-op'd.

- **PRs missing `Closes #NNN` are auto-closed**
  ([#2872](https://github.com/bhargavvc/sdd-cc/issues/2872)) — the
  `Issue link required` workflow now auto-closes any PR opened without a
  closing keyword that links a tracking issue, posting a comment that
  points to the contribution guide. Matches the documented project gate.

### Fixed

- **Gemini slash commands are namespaced as `/sdd:<cmd>` instead of
  `/sdd-<cmd>`** ([#2768](https://github.com/bhargavvc/sdd-cc/issues/2768),
  [#2783](https://github.com/bhargavvc/sdd-cc/issues/2783)) — Gemini
  CLI namespaces commands under `sdd:` so `/sdd-plan-phase` was
  unexecutable. The Gemini install path now converts every body-text
  reference via a roster-checked regex (boundary lookbehind + extension-
  aware lookahead + roster lookup, defense-in-depth) and consistently
  rewrites command files, agent bodies, and final-banner / patch-reapply
  hints to colon form. The roster fail-loud guard prevents silent
  no-op'ing if the source `commands/sdd/` directory is ever missing.

- **SDD slash-command namespace drift cleaned up across docs, workflows
  and autocomplete** ([#2858](https://github.com/bhargavvc/sdd-cc/pull/2858))
  — remaining stale `/sdd:<cmd>` references in active surfaces now use
  canonical `/sdd-<cmd>`, escaped workflow `Skill(skill="sdd:...")`
  prompts now use hyphenated skill names, `scripts/fix-slash-commands.cjs`
  rewrites retired colon syntax to hyphen syntax, and the extract-
  learnings command file is now `extract-learnings.md` so generated
  Claude / Qwen skill autocomplete exposes `sdd-extract-learnings`
  instead of `sdd-extract_learnings`.

- **`SKILL.md` description quoted for Copilot / Antigravity / Trae /
  CodeBuddy** ([#2876](https://github.com/bhargavvc/sdd-cc/issues/2876))
  — descriptions starting with a YAML 1.2 flow indicator (`[BETA] …`,
  `{`, `*`, `&`, `!`, `|`, `>`, `%`, `@`, backtick) are parsed as flow
  sequences / mappings by strict YAML loaders and crash gh-copilot's
  frontmatter loader. Six emission sites now wrap the description in
  `yamlQuote(...)` (= `JSON.stringify`, a valid YAML 1.2 double-quoted
  scalar). The Claude variant already routed through `yamlQuote`; the
  others are now in line.

- **`sdd-tools` invocations use the absolute installed path**
  ([#2851](https://github.com/bhargavvc/sdd-cc/issues/2851)) — bare
  `sdd-tools …` calls inside skill bodies relied on PATH resolution that
  is not guaranteed in every runtime; replaced with the absolute path
  emitted at install time.

- **Codex installer preserves trailing newline when stripping legacy
  hooks** ([#2866](https://github.com/bhargavvc/sdd-cc/issues/2866))
  — the legacy-hook strip in the Codex installer ran against files with
  no terminating newline at EOF and emitted a config that lost the
  newline, breaking downstream parsers. Strip path now normalises EOF.

---

## What was in rc.7

[`RELEASE-v1.39.0-rc.7.md`](RELEASE-v1.39.0-rc.7.md) — first 1.39.0 RC to
roll the post-rc.5 fixes from `main` into the release branch. Includes
the `extractCurrentMilestone` fenced-code-block fix
([#2787](https://github.com/bhargavvc/sdd-cc/issues/2787)),
`audit-uat` frontmatter parse fix
([#2788](https://github.com/bhargavvc/sdd-cc/issues/2788)), the
≤ 100-char skill description budget + lint gate
([#2789](https://github.com/bhargavvc/sdd-cc/issues/2789)), the
`sdd-sdk` workstream + binary-collision fixes
([#2791](https://github.com/bhargavvc/sdd-cc/issues/2791)),
`OpenCode` per-tier model overrides
([#2794](https://github.com/bhargavvc/sdd-cc/issues/2794)),
`roadmap update-plan-progress --phase` flag handling
([#2796](https://github.com/bhargavvc/sdd-cc/issues/2796)),
`context_window` allowlist entry
([#2798](https://github.com/bhargavvc/sdd-cc/issues/2798)),
`/sdd-ingest-docs` init dispatch
([#2801](https://github.com/bhargavvc/sdd-cc/issues/2801)),
`config-get --default` flag
([#2803](https://github.com/bhargavvc/sdd-cc/issues/2803)),
`find-phase` archived-phase null
([#2805](https://github.com/bhargavvc/sdd-cc/issues/2805)),
SKILL.md hyphen-form name migration
([#2808](https://github.com/bhargavvc/sdd-cc/issues/2808)),
canary workflow `workflow_dispatch`
([#2828](https://github.com/bhargavvc/sdd-cc/issues/2828)),
`sdd-sdk` local-mode resolve
([#2829](https://github.com/bhargavvc/sdd-cc/issues/2829)),
OpenCode `@file` HOME expansion
([#2831](https://github.com/bhargavvc/sdd-cc/issues/2831)),
`sdd-sdk auto` Codex detection
([#2832](https://github.com/bhargavvc/sdd-cc/issues/2832)),
CR-INTEGRATION hyphen alignment
([#2835](https://github.com/bhargavvc/sdd-cc/issues/2835)),
`audit-open` SUMMARY filename + UAT terminal status
([#2836](https://github.com/bhargavvc/sdd-cc/issues/2836)),
SUMMARY rescue with gitignored `.planning/`
([#2838](https://github.com/bhargavvc/sdd-cc/issues/2838)),
transactional cleanup tail for `/sdd-code-review-fix`
([#2839](https://github.com/bhargavvc/sdd-cc/issues/2839)).

## What was in rc.5 / rc.6

[`RELEASE-v1.39.0-rc.5.md`](RELEASE-v1.39.0-rc.5.md) and
[`RELEASE-v1.39.0-rc.6.md`](RELEASE-v1.39.0-rc.6.md). rc.6 was a
content-identical republish of rc.5; rc.5 hardened the Codex hooks
migrator across five edge-cases
([#2809](https://github.com/bhargavvc/sdd-cc/issues/2809)).

## What was in rc.4

[`RELEASE-v1.39.0-rc.4.md`](RELEASE-v1.39.0-rc.4.md) — the `--minimal`
install flag landed
([#2762](https://github.com/bhargavvc/sdd-cc/issues/2762)) along
with the Codex `~/.codex/config.toml` corruption fix
([#2760](https://github.com/bhargavvc/sdd-cc/issues/2760)).

---

## Installing the pre-release

```bash
# npm
npm install -g @bhargavvc/sdd-cc@next

# npx (one-shot)
npx @bhargavvc/sdd-cc@next
```

To pin to this exact RC:

```bash
npm install -g @bhargavvc/sdd-cc@1.40.0-rc.1
```

---

## What's next

- Soak rc.1 against real installs across Claude Code, Codex, Copilot,
  Gemini, OpenCode, and Antigravity runtimes.
- Wire write-side phase-lifecycle status-line on top of the
  [#2833](https://github.com/bhargavvc/sdd-cc/issues/2833) read-side.
- Run `finalize` on the release workflow to promote `1.40.0` to `latest`
  once the train has soaked.
