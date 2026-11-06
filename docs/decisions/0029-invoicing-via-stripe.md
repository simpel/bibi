# 0029 – Invoicing via Stripe

- **Date:** 2026-10-15
- **Status:** Accepted
- **Related:** 0028, 0052, 0057, 0077 (SIE export), 0087 (Fortnox connection)

## Context
- Customers can pay against invoice. Fortnox, Visma and Peppol are stated differentiators, but each needs per-organization OAuth, secret storage and certification work.
- The first release needs one invoicing path.

## Decision
1. Invoices attach to the order and can be created only in a phase with the `invoiceable` flag.
2. Invoices are issued through Stripe Invoicing on the venue's connected account, behind the same `PaymentProvider` interface as ADR 0028. One provider, one webhook path.
3. Fortnox, Visma and Peppol are deferred and return as accounting adapters when a venue needs them.
4. An invoice snapshots the order's lines when issued and is never edited. Its status holds only its own lifecycle. Payment progress is derived (ADR 0052, 0057).

## Rejected
- Building Fortnox, Visma and Peppol adapters first: too much per-organization integration work before any venue is live.

## Consequences
- Accounting reaches Fortnox, Visma and others through the SIE 4I file (ADR 0077). A Fortnox OAuth connection exists but posts nothing (ADR 0087).
- An invoice raised in Stripe is owned by Stripe. Our row mirrors its number and status. Sent and void dates and refunds are Bibi's own rows.
- Gap to verify before the first venue: whether Stripe Invoicing meets Swedish invoice rules and Peppol demands from public-sector customers such as museums. If not, a Peppol route becomes a blocking follow-up.
