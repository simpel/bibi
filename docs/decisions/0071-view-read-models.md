# 0071 – View read models: one query per screen, every field gated by its feature

- **Date:** 2026-10-25
- **Status:** Accepted
- **Amends:** 0050 (the feature scope rule)
- **Order:** #484
- **Related:** 0003 (parity), 0007 (AI-first UX), 0044, 0052, 0059, 0064

## Context
- ADR 0050 says an operation returns only its own feature's data, and other features' records are ids resolved through their own operations. The goal is that denying `read` hides a feature everywhere.
- The availability calendar shows customer, contact, guest count, value, notes, who to call, who works it, and state with holds and buffers. Under ADR 0050 that is seven owner reads per screen, joined by hand.
- The assistant is a second client and would make the same seven calls through MCP, costing tokens and latency.
- The rule is already bent where it matters. The goal of ADR 0050 is about what a caller sees, and "ids only" is one way to get there.

## Decision
1. A view read model is a query operation that answers one screen's question and joins whatever it needs across features. `calendar.range` is the first.
2. Every field from another feature is gated by that feature's `read`. The field is `null` (or the list empty) when the caller lacks it, never an error. One core helper does the gating so a test can cover each field.
3. Views never write and never own data. Commands, single-entity reads and archiving stay on the owner feature. A view's output is never stored.
4. The view's own permission is the screen's. Its description says which fields need which feature, so an LLM can tell hidden from empty.
5. Parity is unchanged. A view is an ordinary operation on every surface, and the assistant gets the screen's answer in one call.
6. ADR 0050's rule now reads: an owner operation returns only its own feature's data; a view read model may join others', each field gated by its feature's `read`.

## Rejected
- Composing in each client from owner operations with new `ids` filters: one call per feature per chunk, repeated by every client.
- Joining in GraphQL resolvers: only GraphQL benefits, which breaks parity.
- Dropping feature scope: loses "denying `read` hides a feature everywhere".

## Consequences
- Owner list operations need no bulk `ids` filters just to serve screens.
- Views duplicate some selection logic. That is accepted because a view is shaped by its screen.
- Risk: a view leaking an ungated field. Mitigation: the helper plus a per-view test that runs without each feature's `read` and expects `null`.
