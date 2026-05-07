---
name: sdd-ideate
description: "exploration capture | explore sketch spike spec capture"
argument-hint: ""
allowed-tools:
  - Read
  - Skill
---

Route to the appropriate exploration / capture skill based on the user's intent.
`sdd-note`, `sdd-add-todo`, `sdd-add-backlog`, and `sdd-plant-seed` were folded
into `sdd-capture` (with `--note`, default, `--backlog`, `--seed` modes) by
#2790. The capture target lists pending todos via `--list`.

| User wants | Invoke |
|---|---|
| Explore an idea or opportunity | sdd-explore |
| Sketch out a rough design or plan | sdd-sketch |
| Time-boxed technical spike | sdd-spike |
| Write a spec for a phase | sdd-spec-phase |
| Capture a thought (todo / note / backlog / seed) | sdd-capture |

Invoke the matched skill directly using the Skill tool.
