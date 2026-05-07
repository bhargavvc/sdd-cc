---
name: sdd-context
description: "codebase intelligence | map graphify docs learnings"
argument-hint: ""
allowed-tools:
  - Read
  - Skill
---

Route to the appropriate codebase-intelligence skill based on the user's intent.
`sdd-scan` and `sdd-intel` were folded into `sdd-map-codebase` flags by #2790.

| User wants | Invoke |
|---|---|
| Map the full codebase structure | sdd-map-codebase |
| Quick lightweight codebase scan | sdd-map-codebase --fast |
| Query mapped intelligence files | sdd-map-codebase --query |
| Generate a knowledge graph | sdd-graphify |
| Update project documentation | sdd-docs-update |
| Extract learnings from a completed phase | sdd-extract-learnings |

Invoke the matched skill directly using the Skill tool.
