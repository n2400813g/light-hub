---
name: find-workflow
description: Find an existing Light workflow, skill, agent or automation for a task before anyone builds a new one. Use when someone asks "is there a workflow for", "has anyone built", "how do we usually", "what's the best way to", or "surely someone already automated", "is there something that", "what workflows do I have", "what's available for my team", "I'm new", "what can you help me with at Light", or describes a recurring task at Light in any team.
metadata:
  owner: AI Academy
  team: operations
  status: company
  version: "3"
---

# Find a workflow

If the person is new or asks what they have, list the workflows for their team and light-core from the catalog, each with one line on what it does and one example of what to say to start it. Then stop.

1. Read `references/catalog.md`. It is generated from the hub and lists every workflow with its team, status, owner and how to run it.
2. Match the person's task against each row's description. Prefer, in order: the person's own team, status `company` or `team`, then `draft`.
3. Answer with at most three matches. For each: the name, what it does in one line, the owner, the status, and how to run it (the skill name if it is installed in Claude, or the link for automations that run elsewhere).
4. If a match is `draft`, say so and name the owner, so the person can ask them before relying on it.
5. If the match is a skill the person doesn't have (not in their skills list, or marked "Not released yet"), name its plugin and the owner to ask for access. Don't try to run it from the catalog text.
6. If nothing fits, say so plainly. If the person wants one built, or said they do this by hand, go straight on with the `request-workflow` steps in the same reply instead of only offering them.

## Never

- Never describe a workflow that is not in the catalog.
- Never run a matched workflow without the person asking; finding and running are separate steps.
