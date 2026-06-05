# /sdd:commit — Manual Conventional Commit

Interactive git commit. Surveys the working tree, suggests a conventional commit message
from the diff, asks the user to confirm, then stages + commits **specific files only**.

This is the fork-added replacement for the auto-commit step previously embedded in `/sdd:fast`.
Team policy: never auto-stage with `git add -A` / `git add .` without explicit consent.

## Argument parsing

Set TEXT_MODE=true if `--text` appears in `$ARGUMENTS` OR `workflow.text_mode` is true in the
init JSON. When TEXT_MODE is active, replace every AskUserQuestion call below with a plain-text
numbered list and ask the user to type their choice — every runtime can handle that, including
non-Claude runtimes (Codex, Gemini) that render AskUserQuestion as inert markdown.

## Process

<step name="check_repo">
Verify a git repository:

```bash
git rev-parse --show-toplevel
```

If this errors, STOP and tell the user: "Not in a git repository — nothing to commit."
</step>

<step name="survey_changes">
Show the user what's changed:

```bash
echo "=== Tracked modifications ==="
git status --short | grep -Ev "^\?\?" || echo "(none)"
echo
echo "=== Untracked files ==="
git status --short | grep "^??" || echo "(none)"
echo
echo "=== Diff summary ==="
git diff --stat HEAD 2>/dev/null
```

If working tree is clean (`git status --porcelain` empty), STOP and tell the user
"Nothing to commit — working tree is clean."
</step>

<step name="select_files">
Default behavior: **stage only tracked modifications** — never untracked, never `-A`.

If untracked files exist, ask the user (via AskUserQuestion, or a plain-text numbered list
when TEXT_MODE is active) which they want included:

- **Tracked changes only** (recommended — safest)
- **Also stage these untracked files: [list]** (only if user confirms each one is intentional)
- **Cancel** — abort the commit

If the user invoked the command with `--all`, skip the question but **still echo the file list
back and ask one final yes/no confirmation** before proceeding — `--all` is not a license to
commit secrets without showing the user.

Refuse to stage files matching common secret patterns. If a candidate file matches any of these
patterns, omit it from the stage list and warn the user:

- `*.env`, `.env.*` (env files)
- `*.pem`, `*.key`, `*.crt`, `*.p12`, `*.pfx` (keys / certs)
- `*credentials*`, `*secret*`, `*token*` (credential-like names)
- `node_modules/`, `dist/`, `build/`, `coverage/` (build artifacts — already gitignored, but defense-in-depth)

The user can override per-file by re-running with the file explicitly named in their message.
</step>

<step name="suggest_message">
If the user passed a message as the first argument, **use it verbatim** and skip to the next step.

Otherwise, generate a conventional commit message from the staged diff:

```bash
git diff --cached    # primary source — only the files about to be committed
```

If nothing is staged yet (because we're previewing before staging), use:

```bash
git diff             # working-tree diff for the files we plan to stage
```

Pick a type from this table — choose the **dominant** change type, not the loudest:

| Type       | When                                             |
| ---------- | ------------------------------------------------ |
| `feat`     | New user-facing feature, endpoint, component     |
| `fix`      | Bug fix, error correction                        |
| `refactor` | Internal cleanup, no behavior change             |
| `test`     | Test-only changes (TDD RED, missing coverage)    |
| `docs`     | Documentation only                               |
| `chore`    | Config, tooling, deps, build scripts             |
| `perf`     | Performance improvement, no behavior change      |
| `style`    | Formatting, whitespace, no logic change          |

Format: `<type>(<scope>): <subject>`
- `<scope>` is optional — use it when changes are localized to one module (e.g., `feat(auth):`).
- `<subject>` must be ≤ 72 chars, lowercase, no trailing period, imperative mood ("add X" not "added X").

If the change is large enough to warrant a body, include 2-4 bullet lines beneath the subject
explaining the *why* (not the *what* — the diff shows what).

Show the user the proposed message + the staged file list. Ask (via AskUserQuestion, or a
plain-text numbered list when TEXT_MODE is active):

- **Commit with this message**
- **Edit the message** — user types a replacement; you re-show + re-confirm
- **Cancel** — abort, leave the working tree as-is
</step>

<step name="stage_and_commit">
Stage the approved files explicitly — never `-A`, never `.`:

```bash
git add path/to/file1 path/to/file2 …
```

Commit using a HEREDOC for multi-line-message safety:

```bash
git commit -m "$(cat <<'EOF'
<approved message>
EOF
)"
```

If a pre-commit hook fails:
- Show the hook's output to the user
- Do NOT pass `--no-verify` to bypass it
- Stop and let the user fix the underlying issue, then re-run `/sdd:commit`

Never `git commit --amend` an existing commit unless the user explicitly asked. Amend rewrites
history and surprises co-authors.
</step>

<step name="report">
Print the short hash and what landed:

```
✅ Committed {short-hash}: <type>(<scope>): <subject>
   Files: <file1>, <file2>, …

Run `git push` when ready (this skill does not push).
```

No next-step suggestions. No workflow routing. Done.
</step>

## Guardrails

- NEVER `git add -A` or `git add .` without an explicit confirmation step that lists every file going in.
- NEVER `git push` from this skill — pushing is a separate, riskier action; user runs it manually.
- NEVER `--amend` unless the user explicitly asked.
- NEVER pass `--no-verify` to bypass hooks — surface the failure and stop.
- NEVER stage files matching the secret-pattern allowlist above without an explicit per-file confirmation.

## Success criteria

- [ ] User saw the proposed message before commit
- [ ] User saw every file going into the commit
- [ ] Commit landed on the current branch (not detached HEAD, not main without intent)
- [ ] No `.env` / credentials / build artifacts were staged
- [ ] No `--amend`, no `--no-verify`, no `git push`
