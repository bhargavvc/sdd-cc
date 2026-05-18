---
name: sdd-quality
description: "quality gates | code review debug audit security eval ui"
argument-hint: ""
allowed-tools:
  - Read
  - Skill
requires: [code-review, audit-uat, secure-phase, eval-review, ui-review, validate-phase, debug, forensics]
---

Route to the appropriate quality / review skill based on the user's intent.
`sdd-code-review-fix` was absorbed by `sdd-code-review --fix` in #2790.

| User wants | Invoke |
|---|---|
| Review code for quality and correctness | sdd-code-review |
| Auto-fix code review findings | sdd-code-review --fix |
| Audit UAT / acceptance testing | sdd-audit-uat |
| Security review of a phase | sdd-secure-phase |
| Evaluate AI response quality | sdd-eval-review |
| Review UI for design and accessibility | sdd-ui-review |
| Validate phase outputs | sdd-validate-phase |
| Debug a failing feature or error | sdd-debug |
| Forensic investigation of a broken system | sdd-forensics |

Invoke the matched skill directly using the Skill tool.
