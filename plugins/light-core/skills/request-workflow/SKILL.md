---
name: request-workflow
description: Turn a recurring task that no workflow covers, or a workflow that got it wrong, into a short post for the AI Academy and the workflow's owner. Use when find-workflow finds nothing, or someone says "can someone build", "I keep doing this by hand", "this takes me hours every week", "we should automate this", "this workflow got it wrong", "the skill keeps doing X" or "this is out of date".
metadata:
  owner: AI Academy
  team: operations
  status: company
  version: "2"
---

# Request or flag a workflow

## A new workflow

1. Ask only for what is missing: the task, how often it happens, who else does it, which systems it touches (HubSpot, Light, Slack, Drive, email), and what a good result looks like.
2. Ask for one real example of the input and the output. Remove names, email addresses, amounts and account numbers from it.
3. Draft the request in the format below, for the person to post in #light-hub themselves.

```
Request: <one line>
Team: <team>    How often: <per week>    Others who do it: <names or roles>
Systems: <list>
Good looks like: <one or two lines>
Example: <anonymised input and output>
```

## A workflow that got it wrong

1. Find the workflow and its owner in `find-workflow`'s catalog.
2. Ask what it did, what it should have done, and whether it happens every time or only sometimes.
3. Draft this post for the person to put in #light-hub, tagging the owner:

```
Flag: <workflow name> (owner: <owner>)
It did: <one line>
It should: <one line>
How often: <every time | sometimes | once>
Example: <anonymised input and output>
```

4. Tell them the owner fixes it and bumps the version, and the fix reaches everyone on the next sync. Until then they can correct the output by hand.

## Never

- Never post the request or the flag yourself.
- Never include customer, employee or partner data in the example.
