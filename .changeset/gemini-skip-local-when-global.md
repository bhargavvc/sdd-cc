---
type: Fixed
pr: 3037
---
**Gemini local install no longer duplicates `/sdd:*` commands across user and workspace scopes** — when SDD is already installed at the user scope (`~/.gemini/commands/sdd/`) and you run `npx @bhargavvc/sdd-cc --gemini --local` in a project, the installer now skips writing `commands/sdd/` to `<project>/.gemini/` and prints a one-line warning explaining why. Previously, both scopes received the same 65 command files, and Gemini's conflict detector renamed every `/sdd:*` command to `/workspace.sdd:*` and `/user.sdd:*`, breaking the documented namespace. Closes #3037.
