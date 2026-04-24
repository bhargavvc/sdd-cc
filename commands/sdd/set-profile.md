---
name: sdd:set-profile
description: Switch model profile for SDD agents (quality/balanced/budget/inherit)
argument-hint: <profile (quality|balanced|budget|inherit)>
model: haiku
allowed-tools:
  - Bash
---

Show the following output to the user verbatim, with no extra commentary:

!`if ! command -v sdd-sdk >/dev/null 2>&1; then printf '⚠ sdd-sdk not found in PATH — /sdd-set-profile requires it.\n\nInstall the SDD SDK:\n  npm install -g @bhargavvc/sdk\n\nOr update SDD to get the latest packages:\n  /sdd-update\n'; exit 1; fi; sdd-sdk query config-set-model-profile $ARGUMENTS --raw`
