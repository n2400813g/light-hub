---
name: publish-workflow
description: Package something that already works for one person (a prompt, a chat routine, a checklist, an automation) as a hub workflow that colleagues can run. Use when someone says "save this as a skill", "share this with my team", "publish this", "make this reusable" or "others should use this".
metadata:
  owner: AI Academy
  team: operations
  status: company
  version: "2"
---

# Publish a workflow

1. Ask what the workflow does, when it should be used, and what it must never do. Use the conversation so far as the first draft.
2. Write a `SKILL.md` with this header, then the steps, a `## Never` section and three short examples of input and expected output:

```
---
name: <kebab-case, unique>
description: <what it does>. Use when <the words people would say>.
metadata:
  owner: <a named person>
  team: <sales | partners | customer-success | marketing | operations | finance | people | legal>
  status: draft
  version: "1"
---
```

   If the workflow reads a system such as HubSpot, include the line: "If <system> isn't available to you, ask for the record to be pasted in. Never fill gaps from memory."

3. Check it holds procedure, never data: no names of customers or colleagues, email addresses, amounts, or account numbers. Context such as deals or invoices is fetched when the workflow runs, with the user's own access.
4. Give the person the finished `SKILL.md` as a file they can keep using themselves, and draft this post for them to put in #light-hub:

```
Sharing a workflow: <name>
What it does: <one line>
Team plugin: <team>    Owner: <the person>
Tried on: <how many real cases, by whom>
(SKILL.md attached)
```

5. Tell them how it travels. Their team champion reviews it and adds it to the team plugin as `draft`, and the catalog shows it as a draft with them as owner. It becomes `team` once two colleagues reply in the thread that it worked on a real case of theirs. Company-wide status needs the AI Academy's review. They never need to touch GitHub.

## Never

- Never mark a new workflow as `team` or `company`; it starts as `draft`.
- Never publish a workflow without a named owner.
- Never post in #light-hub yourself; the person posts it.
