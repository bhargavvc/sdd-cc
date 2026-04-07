---
name: sdd:explore
description: Socratic ideation and idea routing — think through ideas before committing to plans
allowed-tools:
  - Read
  - Write
  - Bash
  - Grep
  - Glob
  - Task
  - AskUserQuestion
---
<objective>
Open-ended Socratic ideation session. Guides the developer through exploring an idea via
probing questions, optionally spawns research, then routes outputs to the appropriate SDD
artifacts (notes, todos, seeds, research questions, requirements, or new phases).

Accepts an optional topic argument: `/sdd-explore authentication strategy`
</objective>

<execution_context>
@~/.claude/sdd/workflows/explore.md
</execution_context>

<process>
Execute the explore workflow from @~/.claude/sdd/workflows/explore.md end-to-end.
</process>
