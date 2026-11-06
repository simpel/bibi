# 0084 – An order draft read from a message

- **Date:** 2026-11-01
- **Status:** Accepted
- **Related:** 0007 (AI proposes, the user confirms), 0081 (order intake), 0085 (amends: any channel), 0008, 0064, 0078, 0003

## Context
- A request arrives as free text and staff retype every value into the intake.
- Bibi had one AI call, chat streaming. Nothing read structured output from a model.
- A draft must never become a booking without a person checking it, and staff must see where each value came from and which were guessed.

## Decision
1. A query, `orderDraft.fromMessage`, takes `{ text }` or `{ inboundMessageId }` and returns a draft. It writes nothing. It needs `order:write` (and `inbox:read` for a message id) and exists on every surface.
2. The draft is per field, `{ value, quote, guessed }`. The quote is the exact source text; a quote not found in the message marks the field guessed.
3. Ids are never invented. The model returns text and core resolves customer, contact, package and list values deterministically against the organization's own data. Unmatched values stay as text.
4. Times are resolved by core in the organization's zone (ADR 0064), not by the model.
5. Model output is Zod-validated. Invalid output gives `UNAVAILABLE` and intake falls back to manual entry.
6. It is an AI feature, `order.intakeDraft`, with a model chosen by a superadmin. Core calls the model through an injected `extract` port so core does not depend on the AI SDK.
7. The message text goes to the gateway only. The draft is not stored and the log never holds the text or extracted values.
8. The person pressing Create is the approval (ADR 0007). Every guessed value becomes an open question that blocks Create. The order's history records that it was drafted from a message.
9. In chat, a system skill calls `orderDraft.fromMessage` through MCP and proposes `order.create` as an approval card.

## Rejected
- Let the assistant fill the form through chat only. A round trip per field is slower than a draft with evidence.
- Let the model pick ids. A model can invent or confuse them.
- Create the order directly from the email. Spam and half-formed requests would become orders.
- Store the draft. No new lifecycle; the browser draft covers it.

## Consequences
- First use of structured output: the port, mock responses for tests and a model setting for the feature.
- Depends on `customer.findSimilar` (ADR 0081) and, for message ids, the inbox (ADR 0085).
