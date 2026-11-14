# 0108 – One accounting system at a time

- **Date:** 2026-11-14
- **Status:** Accepted (the user's decision, 2026-11-14)
- **Amends:** 0100 (providers as ports: the INVOICE route picks among connected providers), 0106 (the accounting system issues every money document)
- **Related:** 0051 (single source of truth), 0077 (accounts are organization data)

## Context
- ADR 0106 makes the accounting system (Fortnox or Spiris) issue every invoice and deposit invoice. ADR 0100 let a venue connect both and pick one with the INVOICE route.
- Two connected ledgers mean two sets of books and two number series for one venue, and an unclear answer to "which system holds this invoice". Every account check, sync and credit then has to say which one it speaks about.
- Venues do switch accounting system, but they do not run two at once.

## Decision
1. A venue has at most one connected provider that keeps the books (`capabilities.ledger`). `integration.connect` and its callback refuse (`CONFLICT`) while another one is connected; the admin disconnects it first. Reconnecting the same provider stays allowed. Card and Swish providers are not affected and can be used together.
2. A successful connect of a ledger moves a saved INVOICE route to it, so a switch never leaves documents blocked on the disconnected system. No saved route still means the connected one takes them.
3. Invoices already raised stay in the system that raised them. After the disconnect Bibi no longer reads their payments from there. The disconnect dialog says so.
4. The Integrations page groups providers by what they are used for (invoicing and bookkeeping, card payments, Swish), not by provider.

## Rejected
- Both connected, one chosen by the INVOICE route (ADR 0100 as built). Two ledgers per venue with no use case; every check doubles.
- Refuse the switch while open invoices exist in the old system. Safer for payment mirroring, but it blocks a real switch behind a list of invoices to close first. Can follow if venues lose mirrored payments in practice.

## Consequences
- The demo seed models a switch (Vingaleden raises VW1 in Fortnox, then switches to Spiris) instead of connecting both.
- Open invoices at the old system keep their state in Bibi until staff record the outcome there; this is the cost of decision 3.
- Lifting the rule later is one check in `integration.connect`; nothing is stored differently.
