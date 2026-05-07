---
name: sdd-manage
description: "config workspace | workstreams thread update ship inbox"
argument-hint: ""
allowed-tools:
  - Read
  - Skill
---

Route to the appropriate management skill based on the user's intent.
`sdd-config` (settings + advanced + integrations + profile) and `sdd-workspace`
(new + list + remove) are post-#2790 consolidated entries.

| User wants | Invoke |
|---|---|
| Configure SDD settings (basic / advanced / integrations / profile) | sdd-config |
| Manage workspaces (create / list / remove) | sdd-workspace |
| Manage parallel workstreams | sdd-workstreams |
| Continue work in a fresh context thread | sdd-thread |
| Pause current work | sdd-pause-work |
| Resume paused work | sdd-resume-work |
| Update the SDD installation | sdd-update |
| Ship completed work | sdd-ship |
| Process inbox items | sdd-inbox |
| Create a clean PR branch | sdd-pr-branch |
| Undo the last SDD action | sdd-undo |

Invoke the matched skill directly using the Skill tool.
