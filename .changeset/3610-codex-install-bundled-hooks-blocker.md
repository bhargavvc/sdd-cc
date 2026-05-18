---
type: Fixed
issue: 3610
---
**Fresh `npx @bhargavvc/sdd-cc@latest --codex` no longer hard-aborts when leftover bundled `hooks/sdd-*` files are present** — `classifyPromptUserAction` in `installer-migration-report.cjs` now recognizes the bundled SDD hooks (`hooks/sdd-<name>.{js,sh,cjs,mjs}`) as a known category (`bundled-sdd-hook`) and resolves them to `remove` so the installer can write the fresh bundled versions. The classifier-based safe-default resolver in `bin/install.js` now runs regardless of TTY state — gating it on `!isTTY` made interactive installs throw `installer migration blocked pending user choice` for files that have no actual user choice to make.
