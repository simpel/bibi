# 0123 – Purposes map to the accounting system's own accounts

- **Date:** 2026-11-27
- **Status:** Accepted (the user's decision, 2026-11-27)
- **Amends:** 0077 (§4: account mapping is organization data), 0106 (rows book to accounts Bibi names), 0108 (the connected ledger is the one source of accounts), 0109 (the default revenue row becomes a purpose)
- **Related:** 0051 (single source of truth), 0056 (references are foreign keys), 0058 (provider calls run after the commit), 0100 (providers as ports)

## Context
- Bibi books invoice rows and deposits to four-digit account numbers staff type on Administration → Accounting (`AccountingSettings`, `RevenueAccount`). Nothing ties a number to the connected accounting system, so a number can be wrong and is only found when an invoice fails.
- A sandbox read of Spiris (2026-11-27) shows what an invoice row can actually use there: an article whose **coding** books to one sales account **per VAT rate** (11 codings such as "Tjänster 25% moms" → 3041, "Tjänster 12% moms" → 3042, "Varor 25% moms" → 3051). Codings cannot be created or changed through the API, and `/accounts` needs an extra scope (`ea:accounting_readonly`). Fortnox rows take a plain account number.
- Staff think in purposes ("deposits", "meals", "rooms"), not numbers.

## Decision
1. Bibi stores **purposes mapped to the connected ledger's accounts**, not numbers. Purposes are `ADVANCES` (deposits), `REVENUE_DEFAULT` and one per item type (`ENTITY_TYPE`). Several purposes may map to the same account. An item type with no mapping uses Default revenue. Only Default revenue and Deposits must be mapped before an invoice or deposit is sent (`CONFLICT` names the missing one).
2. New table `AccountMapping` (organization, **connection**, purpose, optional item type, `providerAccount` text), unique per connection and purpose. It belongs to the ledger connection, so a ledger switch (ADR 0108) starts unmapped. `AccountingSettings`, `RevenueAccount` and item-level revenue rows are removed.
3. `providerAccount` is the provider's own reference, opaque to core. **Fortnox:** the account number. **Spiris:** a **coding family**, the coding name without its VAT part ("Tjänster", "Varor"); at invoice time the adapter takes the family's coding at the row's VAT rate. A numeric reference (migrated data) keeps today's behaviour: the coding that books to that account. Core and the adapters' row input stay strings.
4. The provider's accounts (Fortnox: the chart; Spiris: the families with the VAT rates each covers) are a **snapshot on the connection**, filled by `integration.syncAccounts` after the commit (ADR 0058), on connect and on request, never on page load.
5. Problems are **derived on read** from mappings, snapshot and the organization's VAT rates (mapped account gone, a family without a coding at a rate in use, no coding for deposits, accounts unreadable). They are no longer stored (`setupIssues`, `setupCheckedAt`, `checkSetup` go).
6. The mapping is edited on the provider's settings page as noodles (React Flow, many-to-one) with a select on each purpose as the keyboard and touch path. Administration → Accounting goes away.
7. Existing numbers are copied into `AccountMapping` for each organization's connected ledger by the migration (no provider call). Fortnox adds the `bookkeeping` scope; connected venues reconnect once.

## Rejected
- Keep typed numbers and only warn. The failure stays: a valid-looking number that means nothing at the provider.
- Map to one Spiris sales account per purpose. A row at 12% VAT needs 3042, not 3041; one account per purpose breaks for any item sold at two rates.
- One noodle per Spiris coding. Correct but a purpose then needs one line per VAT rate it is sold at.
- A mapping owned by the organization, not the connection. A switch would carry references that mean nothing in the new system.
- Store the provider's chart in its own table. A snapshot with a refresh is enough and is replaced whole.

## Consequences
- Breaking change to `accountingSettings.*` on every surface (replaced by `accountMapping.list|set` and `integration.syncAccounts`): `feat!` for db, core, api, graphql and mcp; no paying venue yet (ADR 0031).
- Deposits on Spiris still need a coding that books to a customer-advances account, created by the venue in Spiris; Bibi shows it as a to-do on the Deposits purpose.
- The Visma pagination bug (first page only) is fixed as part of listing codings.
- A venue that disconnects and reconnects the same provider keeps its mappings; a different provider starts empty.
