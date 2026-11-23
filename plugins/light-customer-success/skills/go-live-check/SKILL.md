---
name: go-live-check
description: Check a customer's implementation against Light's published go-live readiness steps and list what is missing, out of order or at risk, before the customer notices. Use when an Implementation Manager, Data Migration Lead or Agentic Customer Engineer asks "are we ready to go live", "what's left before cutover", "is this project on track", "prep the go-live call", or wants a status check on a migration, cutover or parallel run, including a partner-led implementation.
metadata:
  owner: Customer Success champion
  team: customer-success
  status: draft
  version: "1"
---

# Go-live check

The steps come from our help article [Go-live readiness](https://light.inc/help/getting-started/go-live-readiness). If the article and this workflow disagree, the article wins: flag it with `request-workflow`.

Work from the project's status notes or tracker, pasted in or shared. Ask for what is missing; never assume a step is done.

1. **Dates.** Name the cutoff date (last day in the legacy system) and the go-live date (first day in Light). If either is not set, that is the first gap.
2. **Minimum viable setup.** Mark each as done, not done or unknown:
   - an Admin user, roles per area, approval workflows with thresholds, test users;
   - company, legal entities, currencies and chart of accounts;
   - at least one bank account connected, mapped to its GL account and showing "Synced";
   - invoice, bill, expense and payment workflows, and default GL accounts;
   - Slack or Teams, and HubSpot or Salesforce if the customer uses them;
   - vendors and customers from open AP and AR and last year's postings, and open contracts.
3. **Legacy preparation**, done in the legacy system, not in Light: subledgers reconciled to the GL, open items cleaned up, prior year closed, every account in the agreed period mapped to a Light account code, accruals schedule ready.
4. **Migration order.** Snapshot exports locked, then open AP and AR, then opening trial balance and historical journals, then fixed assets and releases, then FX accounts. Flag anything done out of this order.
5. **Parallel run.** Which of AR, AP, trial balance, bank, expense totals and approval workflows match in both systems, and which variances are still open.
6. **Write the status** for the Implementation Manager: on track or at risk, the three biggest gaps with an owner each, and anything that changes scope.

## Stop and flag

- Payments or bank reconciliation started in Light before open AP and AR were imported and verified. The article says this risks incorrect open balances.
- A difference being patched in Light instead of fixed in the legacy system.
- An account with no mapping. The article names missing mappings as a common cause of delays.

## Never

- Never paste or ask for the customer's ledger, trial balance or bank data. This workflow reads project status only. Customer data goes to an AI tool only after Legal confirms that tool is covered by Light's DPA.
- Never promise the customer a go-live date or a timeline; the Implementation Manager does.
- Never mark a step done because it is usually done by now.
- Never send the status to the customer; the Implementation Manager sends it.

## Examples

1. Notes say bank feeds are live and payments started last week, open AR not imported yet. Expected: "at risk", the payments-before-Step-1 flag first.
2. Notes have no cutoff date. Expected: gap 1 is the cutoff date, and every later step is "unknown" where the notes are silent.
3. A partner-led project with all steps done except the parallel-run AP match. Expected: "on track" with one open variance and its owner.
