# 0029 – Invoicing via Stripe

- **Date:** 2026-10-15
- **Status:** Accepted

## Context
- Customers can pay against invoice (ADR 0022). The domain model has `Invoice` with an export status (Fortnox / Visma) and e-invoice (issue #17).
- Fortnox, Visma and Peppol are stated differentiators, but each needs per-organization OAuth, secret storage and certification work.

## Decision
- **Invoices attach to the ticket** and can be created only in a phase with the `invoiceable` flag (ADR 0043).
- **Invoices are issued through Stripe** (Stripe Invoicing, on the venue's connected account, see ADR 0028), behind the same `PaymentProvider` interface as ADR 0028. One provider, one webhook path.
- **Fortnox, Visma and Peppol are deferred.** They return as accounting adapters behind an interface once a venue needs them.

## Consequences
- Fewer integrations for the first release.
- **Gap to verify before the first venue:** whether Stripe Invoicing satisfies Swedish invoice requirements and e-invoicing (Peppol) demands from public-sector customers such as museums. If not, the Peppol route (via Fortnox/Visma or an access point) becomes a blocking follow-up.
- `CLAUDE.md` still lists Fortnox, Visma and Peppol as differentiators. Revisit the wording when the gap is checked.

## Addendum 2026-10-19 – invoices are snapshots (ADR 0052, 0057)
- An invoice snapshots the ticket's lines at invoicing, like a sent quote, and is never edited afterwards.
- `Invoice.status` and `Deposit.status` keep only their own lifecycle (`DRAFT`, `SENT`, `VOID`). Payment progress is derived from the payments that settle them.
- An invoice raised in Stripe is owned by Stripe; our row mirrors its number and status.
