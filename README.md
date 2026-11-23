# light-hub

Every working workflow at Light, in one place: one plugin per team plus a shared core. Written once in
open formats and packaged for each AI platform Light uses, so the hub is not tied to any one vendor. Prototype for the Light AI Academy case, Part 2. Owners, the GitHub
teams in `hub.json`, and outside-Claude entries marked EXAMPLE or "named in week one" are placeholders.

## What is in it

| Plugin | For | Workflows |
| --- | --- | --- |
| light-core | Everyone | find-workflow, request-workflow, publish-workflow, light-context |
| light-sales | AEs, BDRs, Country Executives | call-follow-up (v8 from the correction loop), account-research, deal-review (draft) |
| light-partners | Partnerships | partner-referral-intake (Part 1) |
| light-finance | Finance; draft, not distributed yet | pricing-approval-memo, plus the Light connector |

How this goes from one Sales pod to all of Light (team map, governance, rhythm, measures):
[docs/company-rollout.md](docs/company-rollout.md).

`catalog/outside-claude.json` lists workflows that run elsewhere (HubSpot workflows, n8n, Light's own agents),
so `find-workflow` can point to them too.

## One source, several platforms

You edit two things: `hub.json` (the plugins, who they are for, each plugin's champion, connectors) and the `SKILL.md` files in
`plugins/<plugin>/skills/`. Skills use the open Agent Skills format. `node scripts/hub.js build` generates
everything else:

| Generated file | Read by |
| --- | --- |
| `plugins/<plugin>/plugin.json`, `mcp.json` | Clients of the open Agent Plugins standard (agent-plugins.org), including ChatGPT and Codex |
| `plugins/<plugin>/.claude-plugin/plugin.json`, `.mcp.json` | Claude |
| `.claude-plugin/marketplace.json` | Claude private organisation marketplaces |
| `.agents/plugins/marketplace.json` | ChatGPT and Codex repository marketplaces, with install policy from `hub.json` |
| `.github/CODEOWNERS` | GitHub: each team's champion must approve changes to their plugin |

A `hidden` plugin is left out of every marketplace, so no platform delivers it. Hidden is not secret: anyone who
can read the repository can install any skill (for example with `npx skills add`), which is why workflows hold
procedure, never data.

Adding a platform means adding one writer to `scripts/hub.js`. The skills, owners and rules do not change.
The Claude packaging passes Claude Code's validator. The manifests deliberately carry no `version`: a set version
keeps everyone on it until someone bumps it, so fixes would never arrive. Without one, Claude tracks the git commit,
as its docs recommend, and `--strict` reports only that missing version. The OpenAI packaging follows OpenAI's documented format
and has not yet been loaded in ChatGPT or Codex.

## Set it up in Claude (Team or Enterprise)

1. Push this repository to a private GitHub repository owned by Light's organisation.
2. Organization settings > Plugins > Marketplaces: add the repository and turn on automatic sync.
3. Set access by group: light-core for everyone, each team plugin for its team's group. Members get them
   installed, so nobody has to search for the basics.
4. Connect HubSpot, Slack and Google Drive once, at organisation level. Workflows use each person's own access.

To try it locally with Claude Code:

    claude plugin marketplace add ./light-hub
    claude plugin install light-core@light-hub
    claude plugin install light-sales@light-hub

## The rules (enforced by `node scripts/hub.js check` on every pull request)

1. Every workflow has a named owner, a team, a status and a version.
2. The description says "Use when ..." in the words people actually use.
3. Every workflow has a "Never" section.
4. Workflows hold procedure, never data: no email addresses, amounts or account numbers.
5. A workflow only points people to workflows they can run: not to one in a hidden plugin.
6. Every plugin has a champion; an outside workflow needs a real link unless it is a draft.

Status: `draft` (in the team plugin, reviewed by the champion), then `team` (two colleagues confirmed it worked on a
real case), then `company` (AI Academy review). `retired` hides it from the catalog. There is no `personal` status in
the repo: a personal skill lives in that person's own Claude.

## How a workflow gets here

1. Someone builds something that works for them in Claude.
2. `publish-workflow` turns it into a SKILL.md with an owner and examples, and drafts a #light-hub post. The author
   posts it; they never touch GitHub.
3. The team champion reviews it and opens a pull request that adds it to the team plugin as `draft`.
4. CI runs the rules and regenerates the catalog. On merge, Claude syncs it to everyone in that team.
5. When two colleagues reply in the thread that it worked on a real case, the champion changes it to `team`.

When a workflow gets something wrong, `request-workflow` drafts a flag post for #light-hub that tags the owner. The
owner fixes it, bumps `metadata.version`, and the fix reaches everyone on the next sync.

Retirement is a decision at the Friday triage, not a timer: Claude does not report use per skill. On Enterprise,
the analytics API's per-plugin counts are one input.

## Commands

    node scripts/hub.js build   # regenerate every platform's packaging from hub.json
    npm test                    # rules, catalog and findability tests
    node scripts/hub.js check   # rules only
    node scripts/hub.js catalog # regenerate the catalog find-workflow reads
    node scripts/hub.js find "the prospect wants a discount"

## Testing it the way people use it

`npm test` checks the rules. Whether the right workflow fires for each team is checked with Claude Code's own
`claude plugin eval`, using one test bundle per kind of person that holds exactly what they have installed:

    node scripts/hub.js bundles /tmp/light-hub-evals
    cd /tmp/light-hub-evals/as-sales && claude plugin eval . --ablation none --runs 2 --max-cost-usd 5

`evals/<bundle>/` holds 12 cases per bundle (Sales, Partnerships, Finance with its plugin still hidden, and a new
joiner with light-core only). Each bundle's requests were written in that role's own words before reading any
skill (`requests-blind.md`), then labelled. Each case checks which skill fired, or that none did, and, where a
"Never" rule applies, that it held. A full run of all four bundles costs about USD 9. Add the words from every
miss to the description, and every real request that went wrong as a new case.

## What the findability test showed

Keyword search found the right workflow in the top three for 15 of 15 requests written with the
descriptions, but only 6 of 11 written in other words. After adding the words from those misses to the
descriptions, a fresh set of 11 got 9 in the top three and 4 first. Search should be the backup, not the
front door: install each team's plugin by group, and add the words from every missed search to the
description. Claude's own matching reads meaning rather than keywords and should do better; it was not
tested here.
