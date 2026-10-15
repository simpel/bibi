# 0029 – Invoicing via Stripe

- **Date:** 2026-10-15
- **Status:** Accepted

## Context
- Customers can pay against invoice (ADR 0022). The domain model has `Invoice` with an export status (Fortnox / Visma) and e-invoice (issue #17).
- Fortnox, Visma and Peppol are stated differentiators, but each needs per-organization OAuth, secret storage and certification work.

## Decision
- **Invoices are issued through Stripe** (Stripe Invoicing, on the venue's connected account, see ADR 0028), behind the same `PaymentProvider` interface as ADR 0028. One provider, one webhook path.
- **Fortnox, Visma and Peppol are deferred.** They return as accounting adapters behind an interface once a venue needs them.

## Consequences
- Fewer integrations for the first release.
- **Gap to verify before the first venue:** whether Stripe Invoicing satisfies Swedish invoice requirements and e-invoicing (Peppol) demands from public-sector customers such as museums. If not, the Peppol route (via Fortnox/Visma or an access point) becomes a blocking follow-up.
- `CLAUDE.md` still lists Fortnox, Visma and Peppol as differentiators. Revisit the wording when the gap is checked.
