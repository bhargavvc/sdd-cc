# Issue tracker: GitHub

Issues for this repo live in **GitHub Issues** at `bhargavvc/sdd-cc`.

## Auth

Use the configured GitHub CLI session for this checkout. Do not require a
repo-local `.envrc` before running `gh`.

## Conventions

- **Create**: `gh issue create --repo bhargavvc/sdd-cc --title "..." --body "..."`
- **Read**: `gh issue view <number> --repo bhargavvc/sdd-cc --comments`
- **List**: `gh issue list --repo bhargavvc/sdd-cc --state open --json number,title,labels --jq '...'`
- **Comment**: `gh issue comment <number> --repo bhargavvc/sdd-cc --body "..."`
- **Label**: `gh issue edit <number> --repo bhargavvc/sdd-cc --add-label "..." --remove-label "..."`
- **Close**: `gh issue close <number> --repo bhargavvc/sdd-cc --comment "..."`

Always pass `--repo bhargavvc/sdd-cc` explicitly — the local clone has multiple remotes and `gh` may resolve to the wrong one.

## When a skill says "publish to the issue tracker"

Create a GitHub issue at `bhargavvc/sdd-cc`.

## When a skill says "fetch the relevant ticket"

Run `gh issue view <number> --repo bhargavvc/sdd-cc --comments`.
