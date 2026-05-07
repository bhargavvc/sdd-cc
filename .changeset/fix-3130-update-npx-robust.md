---
type: Fixed
pr: 3130
---
**`update.md` npx invocations hardened against cache-stale and Bash-tool token-routing failures** — the previous `npx -y @bhargavvc/sdd-cc@latest` form had two failure modes: (1) npx serving a cached older version instead of `@latest`, and (2) Bash-tool wrappers misrouting the `@` token, producing `Unknown command: "@bhargavvc/sdd-cc@latest"`. All three sibling invocations (local, global, unknown/fallback) now use `npx -y --package=@bhargavvc/sdd-cc@latest -- @bhargavvc/sdd-cc` — the `--package=` flag forces a fresh registry fetch and the `--` separator prevents token misrouting. Closes #3130.
