---
name: sdd-project
description: "project lifecycle | milestones audits summary"
argument-hint: ""
allowed-tools:
  - Read
  - Skill
---

Route to the appropriate project / milestone skill based on the user's intent.
`sdd-plan-milestone-gaps` was deleted by #2790 — gap planning now happens
inline as part of `sdd-audit-milestone`'s output.

| User wants | Invoke |
|---|---|
| Start a new project | sdd-new-project |
| Create a new milestone | sdd-new-milestone |
| Complete the current milestone | sdd-complete-milestone |
| Audit a milestone for issues | sdd-audit-milestone |
| Summarize milestone status | sdd-milestone-summary |

Invoke the matched skill directly using the Skill tool.
