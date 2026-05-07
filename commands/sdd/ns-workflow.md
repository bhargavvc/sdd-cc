---
name: sdd-workflow
description: "workflow | discuss plan execute verify phase progress"
argument-hint: ""
allowed-tools:
  - Read
  - Skill
---

Route to the appropriate phase-pipeline skill based on the user's intent.
Sub-skill names below are post-#2790 consolidated targets — `sdd-phase`
absorbs the former add/insert/remove/edit-phase commands and `sdd-progress`
absorbs the former next/do commands.

| User wants | Invoke |
|---|---|
| Gather context before planning | sdd-discuss-phase |
| Clarify what a phase delivers | sdd-spec-phase |
| Create a PLAN.md | sdd-plan-phase |
| Execute plans in a phase | sdd-execute-phase |
| Verify built features through UAT | sdd-verify-work |
| Add / insert / remove / edit a phase | sdd-phase |
| Advance to the next logical step | sdd-progress |
| Offload planning to the ultraplan cloud | sdd-ultraplan-phase |
| Cross-AI plan review convergence loop | sdd-plan-review-convergence |

Invoke the matched skill directly using the Skill tool.
