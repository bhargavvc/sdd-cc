---
name: sdd-thread
description: "Manage persistent context threads for cross-session work"
---

<cursor_skill_adapter>
## A. Skill Invocation
- This skill is invoked when the user mentions `sdd-thread` or describes a task matching this skill.
- Treat all user text after the skill mention as `{{SDD_ARGS}}`.
- If no arguments are present, treat `{{SDD_ARGS}}` as empty.

## B. User Prompting
When the workflow needs user input, prompt the user conversationally:
- Present options as a numbered list in your response text
- Ask the user to reply with their choice
- For multi-select, ask for comma-separated numbers

## C. Tool Usage
Use these Cursor tools when executing SDD workflows:
- `Shell` for running commands (terminal operations)
- `StrReplace` for editing existing files
- `Read`, `Write`, `Glob`, `Grep`, `Task`, `WebSearch`, `WebFetch`, `TodoWrite` as needed

## D. Subagent Spawning
When the workflow needs to spawn a subagent:
- Use `Task(subagent_type="generalPurpose", ...)`
- The `model` parameter maps to Cursor's model options (e.g., "fast")
</cursor_skill_adapter>

<objective>
Create, list, or resume persistent context threads. Threads are lightweight
cross-session knowledge stores for work that spans multiple sessions but
doesn't belong to any specific phase.
</objective>

<process>

**Parse {{SDD_ARGS}} to determine mode:**

<mode_list>
**If no arguments or {{SDD_ARGS}} is empty:**

List all threads:
```bash
ls .planning/threads/*.md 2>/dev/null
```

For each thread, read the first few lines to show title and status:
```
## Active Threads

| Thread | Status | Last Updated |
|--------|--------|-------------|
| fix-deploy-key-auth | OPEN | 2026-03-15 |
| pasta-tcp-timeout | RESOLVED | 2026-03-12 |
| perf-investigation | IN PROGRESS | 2026-03-17 |
```

If no threads exist, show:
```
No threads found. Create one with: /sdd-thread <description>
```
</mode_list>

<mode_resume>
**If {{SDD_ARGS}} matches an existing thread name (file exists):**

Resume the thread — load its context into the current session:
```bash
cat ".planning/threads/${THREAD_NAME}.md"
```

Display the thread content and ask what the user wants to work on next.
Update the thread's status to `IN PROGRESS` if it was `OPEN`.
</mode_resume>

<mode_create>
**If {{SDD_ARGS}} is a new description (no matching thread file):**

Create a new thread:

1. Generate slug from description:
   ```bash
   SLUG=$(node "C:/Users/DS_Chitteti Bhargav/OneDrive - Data Semantics Pvt Ltd/Work/SDD-Setup/sdd-cc/.cursor/sdd/bin/sdd-tools.cjs" generate-slug "{{SDD_ARGS}}" --raw)
   ```

2. Create the threads directory if needed:
   ```bash
   mkdir -p .planning/threads
   ```

3. Write the thread file:
   ```bash
   cat > ".planning/threads/${SLUG}.md" << 'EOF'
   # Thread: {description}

   ## Status: OPEN

   ## Goal

   {description}

   ## Context

   *Created from conversation on {today's date}.*

   ## References

   - *(add links, file paths, or issue numbers)*

   ## Next Steps

   - *(what the next session should do first)*
   EOF
   ```

4. If there's relevant context in the current conversation (code snippets,
   error messages, investigation results), extract and add it to the Context
   section.

5. Commit:
   ```bash
   node "C:/Users/DS_Chitteti Bhargav/OneDrive - Data Semantics Pvt Ltd/Work/SDD-Setup/sdd-cc/.cursor/sdd/bin/sdd-tools.cjs" commit "docs: create thread — ${ARGUMENTS}" --files ".planning/threads/${SLUG}.md"
   ```

6. Report:
   ```
   ## 🧵 Thread Created

   Thread: {slug}
   File: .planning/threads/{slug}.md

   Resume anytime with: /sdd-thread {slug}
   ```
</mode_create>

</process>

<notes>
- Threads are NOT phase-scoped — they exist independently of the roadmap
- Lighter weight than /sdd-pause-work — no phase state, no plan context
- The value is in Context and Next Steps — a cold-start session can pick up immediately
- Threads can be promoted to phases or backlog items when they mature:
  /sdd-add-phase or /sdd-add-backlog with context from the thread
- Thread files live in .planning/threads/ — no collision with phases or other SDD structures
</notes>
