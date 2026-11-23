# Taking light-hub company-wide

What it takes to go from one Sales pod to all of Light, and what it deliberately does not take. Facts about Light
come from public sources (job board, trust centre, DPA, press) as of November 2026. Anything inferred is marked.

## What Light looks like

- **About 150 people in three departments.** The job board lists GTM, Tech and Operations, with teams for
  Engineering, Marketing, Customer Success, People and Operations. Light has offices in London, Copenhagen and
  Stockholm, plus Country Executives in France, the Netherlands, Germany and Italy.
- **Hiring is mostly GTM.** 22 of the 28 open roles are in GTM: AEs, BDRs, account managers, solutions engineers,
  implementation, support, partner sales and regional marketing, most of them in London. New joiners are where the
  hub pays off first.
- **People already use several AI tools.** New hires get Claude, Codex, Lovable and Noon from day one. AI Academy
  members get "all the AI tools on the market". HubSpot is the CRM, Slack is used internally, Ashby runs
  recruiting, and engineering works in GitHub.
- **Compliance.** Light holds SOC 2 Type II and SOC 1 Type II. Its DPA lists OpenAI and Google as AI
  sub-processors; Anthropic is not listed.
- **Light's own engineering rule:** "Every fix requires explicit human approval. Silence is never treated as
  consent."

## The five things company-wide means

### 1. One plugin per team, following Light's own team map

| Plugin | People | Champion | Wave |
| --- | --- | --- | --- |
| light-core | everyone | AI Academy | now |
| light-sales | AEs, BDRs, account managers, solutions engineers, Country Executives | Sales | 1 |
| light-partners | partner sales, partner solutions engineering | Partnerships | 2 |
| light-customer-success | support, agentic customer engineers, implementation, data migration | Customer Success | 2 |
| light-marketing | growth, product and regional marketing | Marketing | 2 |
| light-finance | Finance, and anyone asking Finance | Finance | 3 |
| light-people | talent and people ops (Ashby) | People | 3 |
| light-legal | legal and compliance | Legal & Compliance | 3, not created |

**Where the first workflow of each plugin comes from.** Each one is a task that Light's own job postings
([board](https://jobs.ashbyhq.com/light-inc)) describe as part of the role, written against Light's public pages:

| Workflow | Plugin | The posting says | Written against |
| --- | --- | --- | --- |
| `go-live-check` | customer-success | Implementation Manager: "Spot projects going off-track before the customer does"; Data Migration Lead: "reconciling the result back to the source system" | [Go-live readiness](https://light.inc/help/getting-started/go-live-readiness) |
| `help-article-update` | customer-success | Support Specialist: "keep our help center articles accurate and current"; "Share feature requests and effective workarounds" | [Help Center](https://light.inc/help) |
| `localise-content` | marketing | Nordics, DACH, Benelux and US marketing: "Localising our story, content and campaigns" | `light-context` |
| `hiring-scorecard` | people | Talent Partner: "build the scorecards and calibration that keep the bar high" | Ashby, Light's recruiting system |
| `rfp-answers` | sales | Senior Solutions Engineer: "RFP answers"; "Handle objections on integrations, data migration, security, controls and audit trail" | [Trust Center](https://light.inc/trust-center), [migration](https://light.inc/migration) |

All five start as `draft`. Legal has no plugin: no posting describes a recurring legal task, so there is nothing
verified to build yet. The two customer-success workflows deliberately never take a customer's ledger or ticket
text, so they need no DPA decision to start.

- **A plugin is created when its first workflow reaches `draft`, never before.** Empty plugins are noise.
- **The Light connector** is `https://api.light.inc/rest/ext/mcp` ([Light's AI-client docs](https://light.inc/docs/getting-started/ai-clients)). Claude signs in through OAuth; other clients use a personal MCP token.
- **Engineering and Product get light-core only.** Engineering works in GitHub and has its own coding agent
  (Sirius, from Light's engineering blog), so code skills belong in its own repositories.
- **Regions are not plugins.** A DACH or Nordics difference, such as language, entity or currency, is a step
  inside the workflow ("if the contact is in DACH, write in German"). That keeps it at 8 plugins rather than 30.

### 2. Delivery on every tool people actually have

Light gives new hires Claude, Codex, Lovable and Noon from day one. The repository packages
workflows for these tools, but delivery is not equally native on every platform. Setup steps are in the
[README](../README.md#for-the-hub-admins).

| Tool | Delivery path | Verification and limits |
| --- | --- | --- |
| **Claude** | Organisation marketplace from this repository; plugins can expose skills and connectors across Claude web, desktop, mobile, Cowork and Claude Code. | Strict manifest/schema validation was reported clean. A test installation from GitHub and an update to the newer plugin version were reported successful. Real organisation-wide group sync and the Light connector's OAuth flow still need an authenticated admin test. |
| **Codex CLI** | Add this repository as a plugin marketplace, then install `light-core` and the relevant team plugin. | A throwaway Codex CLI home was used to install Sales and Core at version `0.1.0`; the hidden Finance plugin was rejected. This verifies marketplace installation and hidden-plugin exclusion, not that a workflow actually fires in a live Codex session. |
| **ChatGPT workspace** | Admin imports `.agents/plugins/marketplace.json`. | Not verified in a Business or Enterprise workspace. The workspace importer does not enforce this repository's install policy, so an admin must explicitly leave `light-finance` disabled. Do not treat the Codex CLI test as proof of ChatGPT workspace import. |
| **Lovable** | Paste `light-context` into workspace instructions; import individual skills from ZIP. | The documented workaround was reviewed, but a real Lovable workspace import and workflow use were not tested. Lovable's assistant does not load the hub's workflows as a marketplace. |
| **Noon** | Claude can call Noon through a custom MCP connector; the recruiting workflow is listed in the catalog as a draft. | The connector/catalog setup is documented, but a live Noon connection and end-to-end recruiting workflow were not tested. Noon does not install this plugin marketplace. |
| **Other compatible agents** | The Agent Skills CLI can install skills from the repository. | The supplied test notes report discovery of the skills using an existing GitHub login. Compatibility still depends on each agent's support for the Agent Skills format. |

The supplied implementation notes report that `node scripts/hub.js check --strict` completed without
warnings and `npm test` passed 11/11 tests. Treat those as local test results, not as a green CI result:
the six GitHub Actions runs visible on 23 November 2026 are marked failed, and their job-step details were
not available for diagnosis during this review. Re-run the workflow and inspect its logs before relying on
CI as a release gate.

- **Groups mirror the job board's teams.** They are set once in each platform's admin; the repo does not store
  them.

### 3. Governance: who decides what

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
  person approving that action. Every current workflow says so in its `## Never` section, and reviewers check
  for it. This is Light's own rule for its software: silence is never consent.
- **Procedure, never data.** The check rejects email addresses, amounts and account numbers.
- **Hidden is not secret.** A hidden plugin is not delivered on any platform, but anyone who can read the
  repository can install any skill. The only real access gate is access to the repo. That is acceptable because
  of the previous rule. A procedure that is itself confidential belongs in a separate, restricted repository.
- **Customer data goes through Legal first.** A workflow that would send *customers'* data to an AI provider
  (for example support tickets, or a customer's ledger through the Light connector) needs Legal to confirm that
  provider is covered by Light's DPA. Light's own data (prospects in HubSpot, Light's own books) falls under the
  employee-tool agreements; Legal confirms that once.

### 4. Rhythm

| When | What | Time |
| --- | --- | --- |
| Every Friday | AI Academy and Chief of Staff triage #light-hub requests and flags; retire what nobody uses | 20 minutes |
| Before a merge into a team plugin | the evals for that team run on push and on the pull request (`npm run evals`) | about USD 2 |
| Monthly | champions meet for 30 minutes; full eval run across all bundles; words from every missed search go into descriptions | about USD 9 |
| Each new wave | the AI Academy pairs with the new champion for the first three workflows | one week |

### 5. Measures

Each measure checks whether knowledge moved, not just whether the AI tools were used.
- **New-joiner time to first hub workflow.** 22 of the 28 open roles are in GTM, so this has a steady supply of
  new joiners.
- **Share of each team that ran a team workflow this week.** Claude Enterprise analytics count use per plugin and
  per group; Codex use is reported by people.
- **Requests and flags closed within two weeks.**
- **Eval pass rate per bundle.** The first run was 41 of 48 cases. After the fixes, all eight changed or failing
  cases passed.

## What it deliberately does not take

- **A self-hosted agent platform** (Dust, LibreChat, Open WebUI). These give companies a place to share
  assistants when their AI vendors don't. Light's vendors now do, and the governance maps across:
  - Dust's "publish agents" permission is the champion's merge.
  - LibreChat's admin-approved MCP servers are the Legal-reviewed `hub.json`.
- **Backstage.** Two ideas are borrowed from it: every entry has an owner and a lifecycle stage, and the catalog
  is generated from files next to the work.
- **Per-region plugins, a usage-tracking service, automatic promotion or retirement, a Slack bot.**

## Open-source references

- [Agent Plugins spec](https://github.com/agentplugins/agent-plugins-spec): our generated `plugin.json` and
  `mcp.json` files pass the official 1.0.0 schemas. Stay on 1.0.0: Codex accepts only 1.0.0, and 1.1.0 is still
  a draft.
- [vercel-labs/skills](https://github.com/vercel-labs/skills): proof that a repo like this one installs into
  most agents. Note that it ignores install policy.
- [Dust](https://dust.tt): the self-hosted route not taken.
- [Backstage software catalog](https://backstage.io/docs/features/software-catalog/descriptor-format/): owner and
  lifecycle.

## To confirm in week one

1. **Who owns the hub.** The Chief of Staff to the CEO and the Head of Finance & Operations: who owns the
   roadmap, and who is the AI Academy lead.
2. **Which plans Light has.** Claude Team or Enterprise, and Codex/ChatGPT Business or Enterprise. Analytics per
   plugin need Claude Enterprise.
3. **Whether Anthropic should be added to the DPA,** or whether customer-data workflows stay on OpenAI or Google.
4. **The real champion for each wave-1 and wave-2 team,** replacing the `light-inc/*` placeholders in `hub.json`.
5. **Whether Light runs on Google Workspace or Microsoft 365.** This is inferred to be Google Workspace and not
   confirmed. It decides the Drive connector.
