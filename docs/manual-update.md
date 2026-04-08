# Manual Update (Non-npm Install)

Use this procedure when `npx @bhargavvc/sdd-cc@latest` is unavailable — e.g. during a publish outage or if you are working directly from the source repo.

## Prerequisites

- Node.js installed
- This repo cloned locally (`git clone https://github.com/bhargavvc/sdd-cc`)

## Steps

```bash
# 1. Pull latest code
git pull --rebase origin main

# 2. Build the hooks dist (required — hooks/dist/ is generated, not checked in as source)
node scripts/build-hooks.js

# 3. Run the installer directly
node bin/install.js --claude --global

# 4. Clear the update cache so the statusline indicator resets
rm -f ~/.cache/sdd/sdd-update-check.json
```

**Step 5 — Restart your runtime** to pick up the new commands and agents.

## Runtime flags

Replace `--claude` with the flag for your runtime:

| Runtime | Flag |
|---|---|
| Claude Code | `--claude` |
| Gemini CLI | `--gemini` |
| OpenCode | `--opencode` |
| Kilo | `--kilo` |
| Codex | `--codex` |
| Copilot | `--copilot` |
| Cursor | `--cursor` |
| Windsurf | `--windsurf` |
| Augment | `--augment` |
| All runtimes | `--all` |

Use `--local` instead of `--global` for a project-scoped install.

## What the installer replaces

The installer performs a clean wipe-and-replace of SDD-managed directories only:

- `~/.claude/sdd/` — workflows, references, templates
- `~/.claude/commands/sdd/` — slash commands
- `~/.claude/agents/sdd-*.md` — SDD agents
- `~/.claude/hooks/dist/` — compiled hooks

**What is preserved:**
- Custom agents not prefixed with `sdd-`
- Custom commands outside `commands/sdd/`
- Your `CLAUDE.md` files
- Custom hooks

Locally modified SDD files are automatically backed up to `sdd-local-patches/` before the install. Run `/sdd-reapply-patches` after updating to merge your modifications back in.
