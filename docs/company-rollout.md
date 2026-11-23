# Light Hub rollout

How Light Hub reaches every team at Light, who decides what, and how we know it is working. Owned by the AI
Academy with the Chief of Staff office.

## Who the hub serves

- **About 150 people in three departments:** GTM, Tech and Operations, with teams for Sales, Partnerships,
  Customer Success, Marketing, Engineering, People and Operations. Offices in London, Copenhagen and Stockholm,
  and Country Executives in France, the Netherlands, Germany and Italy.
- **Most new joiners are in GTM:** AEs, BDRs, account managers, solutions engineers, implementation, support,
  partner sales and regional marketing. New joiners are where the hub pays off first.
- **Everyone already has AI tools.** Claude, Codex, Lovable and Noon from day one. HubSpot is our CRM, Slack is
  where we talk, Ashby runs recruiting, and Engineering works in GitHub.
- **Compliance.** Light holds SOC 2 Type II and SOC 1 Type II. Our DPA lists OpenAI and Google as AI
  sub-processors.
- **Our product rule applies to the hub too:** "Every fix requires explicit human approval. Silence is never
  treated as consent."

## 1. One plugin per team

| Plugin | People | Champion | Wave |
| --- | --- | --- | --- |
| light-core | everyone | AI Academy | live |
| light-sales | AEs, BDRs, account managers, solutions engineers, Country Executives | Sales | 1 |
| light-partners | partner sales, partner solutions engineering | Partnerships | 2 |
| light-customer-success | support, agentic customer engineers, implementation, data migration | Customer Success | 2 |
| light-marketing | growth, product and regional marketing | Marketing | 2 |
| light-finance | Finance, and anyone asking Finance | Finance | 3 |
| light-people | talent and people ops (Ashby) | People | 3 |
| light-legal | legal and compliance | Legal & Compliance | 3, when its first workflow is ready |

**Each team's first workflows** cover a task that team does every week, built on the pages customers already
read:

| Workflow | Plugin | The work it covers | Built on |
| --- | --- | --- | --- |
| `go-live-check` | customer-success | Implementation and Data Migration: spot a project going off-track before the customer does, and reconcile the migration back to the source system | [Go-live readiness](https://light.inc/help/getting-started/go-live-readiness) |
| `help-article-update` | customer-success | Support: keep Help Center articles accurate and current, and pass feature requests and workarounds to Product | [Help Center](https://light.inc/help) |
| `localise-content` | marketing | Nordics, DACH, Benelux and US marketing: localise our story, content and campaigns | `light-context` |
| `hiring-scorecard` | people | Talent Partners: the scorecards and calibration that keep the hiring bar high | Ashby |
| `rfp-answers` | sales | Solutions Engineering: RFP answers, and questions on integrations, data migration, security, controls and audit trail | [Trust Center](https://light.inc/trust-center), [migration](https://light.inc/migration) |

These start as `draft`. The two Customer Success workflows never take a customer's ledger or ticket text, so they
need no DPA decision to start.

- **A plugin is created when its first workflow reaches `draft`, never before.** Empty plugins are noise.
- **The Light connector** is `https://api.light.inc/rest/ext/mcp`
  ([AI-client docs](https://light.inc/docs/getting-started/ai-clients)). Claude signs in through OAuth; other
  clients use a personal MCP token.
- **Engineering and Product get light-core only.** Engineering has its own coding agent, Sirius, so code skills
  live in Engineering's own repositories.
- **Regions are not plugins.** A DACH or Nordics difference, such as language, entity or currency, is a step
  inside the workflow ("if the contact is in DACH, write in German"). That keeps it at 8 plugins rather than 30.

## 2. Delivery on every tool people have

The hub packages the same workflows for each tool. Setup steps are in the
[README](../README.md#for-the-hub-admins).

| Tool | How people get the hub | Notes |
| --- | --- | --- |
| **Claude** | Organisation marketplace synced from this repository: skills and connectors across web, desktop, mobile, Cowork and Claude Code | Team plugins install by group on Enterprise; on Team they are *Available to install* |
| **Codex** | Add this repository as a plugin marketplace, then install `light-core` and the team plugin | The hidden Finance plugin cannot be installed |
| **ChatGPT workspace** | An admin imports `.agents/plugins/marketplace.json` | The import does not apply install settings: leave `light-finance` switched off |
| **Lovable** | `light-context` as workspace instructions; skills imported by ZIP | Lovable's chat does not load workflows; apps built in Lovable are listed in the catalog |
| **Noon** | Claude reaches Noon as a connector; recruiting is listed in the catalog | Noon does not install plugins |
| **Other agents** | `npx skills add` installs the same skills into any agent that supports Agent Skills | Does not apply install settings |

Every change is checked before it ships: the hub rules, the tests and the evals for each affected team run on
every push and pull request (see [Testing](../README.md#testing)).

- **Groups mirror our teams.** They are set once in each platform's admin; the repository does not store them.

## 3. Governance: who decides what

| Decision | Who | How |
| --- | --- | --- |
| Use a workflow for yourself | anyone | it stays in your own AI tool |
| Add a workflow to a team as `draft` | the team's champion | pull request; CODEOWNERS requires their review |
| `draft` → `team` | the champion | two colleagues confirm it worked on a real case. Explicit replies, never silence |
| `team` → `company` | AI Academy | review against the rules and the evals |
| New connector, or a change to who gets what | AI Academy **and** Legal & Compliance | both review every change to `hub.json` (generated CODEOWNERS) |
| Retire a workflow | owner or champion | Friday triage |
| What gets built next | Chief of Staff with the AI Academy | Friday triage of #light-hub |

Rules that apply everywhere:
- **Workflows draft; people act.** A workflow never sends, posts, pays or writes to HubSpot or Light without the
  person approving that action. Every workflow says so in its `## Never` section, and reviewers check for it.
- **Procedure, never data.** The check rejects email addresses, amounts and account numbers.
- **Hidden is not secret.** A hidden plugin is not delivered on any platform, but anyone who can read the
  repository can install any skill. That is acceptable because of the previous rule. A procedure that is itself
  confidential belongs in a separate, restricted repository.
- **Customer data goes through Legal first.** A workflow that would send *customers'* data to an AI provider
  (for example support tickets, or a customer's ledger through the Light connector) needs Legal to confirm that
  provider is covered by our DPA. Light's own data (prospects in HubSpot, our own books) falls under the
  employee-tool agreements; Legal confirms that once.

## 4. Rhythm

| When | What | Time |
| --- | --- | --- |
| Every Friday | AI Academy and Chief of Staff triage #light-hub requests and flags; retire what nobody uses | 20 minutes |
| Every change to a team plugin | that team's evals run on push and on the pull request | about USD 2 |
| Monthly | champions meet; full eval run across all teams; words from every missed search go into descriptions | 30 minutes, about USD 9 |
| Each new wave | the AI Academy pairs with the new champion for the first three workflows | one week |

## 5. Measures

Each measure checks whether knowledge moved, not just whether the AI tools were used.
- **New-joiner time to first hub workflow.**
- **Share of each team that ran a team workflow this week.** Claude Enterprise analytics count use per plugin and
  per group; Codex use is reported by people.
- **Requests and flags closed within two weeks.**
- **Eval pass rate per team.**

## What the hub does not do

- **No separate agent platform.** Our AI vendors already let us share workflows inside the tools people use, so
  there is no extra app to host, log into or keep in sync.
- **No per-region plugins, usage-tracking service, automatic promotion or retirement, or Slack bot.** Each of
  these is a judgement a champion makes in the Friday triage.

## Standards the hub follows

- [Agent Skills](https://agentskills.io) for every `SKILL.md`, and the
  [Agent Plugins spec](https://github.com/agentplugins/agent-plugins-spec) 1.0.0 for the generated `plugin.json`
  and `mcp.json`. Stay on 1.0.0: Codex accepts only 1.0.0.
- From the [Backstage software catalog](https://backstage.io/docs/features/software-catalog/descriptor-format/):
  every entry has an owner and a lifecycle stage, and the catalog is generated from files next to the work.

## Open decisions

1. **Hub ownership:** who owns the roadmap, and who leads the AI Academy.
2. **Plans:** Claude Team or Enterprise, and ChatGPT Business or Enterprise. Analytics per plugin need Claude
   Enterprise.
3. **DPA:** whether to add Anthropic, or keep customer-data workflows on OpenAI or Google.
4. **Champions:** the champion for each wave-1 and wave-2 team, set as their GitHub team in `hub.json`.
5. **Documents:** Google Workspace or Microsoft 365, which decides the document connector.
