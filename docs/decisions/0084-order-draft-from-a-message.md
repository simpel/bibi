# 0084 – An order draft read from a message

- **Date:** 2026-11-01
- **Status:** Accepted (approved by the user on 2026-11-01)
- **Related:** 0007 (AI proposes, the user confirms), 0081 (order intake), 0085 (inbound messages from any channel, amends this ADR), 0008 (skills), 0064 (time), 0078 (public email domains), 0003 (parity)

## Context
- A request usually arrives as free text, for example "a wine tasting for 14 people on Friday 21 November, around 3 pm, two of us are vegan". Staff then type every value into the intake (ADR 0081).
- The assistant can read text, but today Bibi has one AI call, `streamText` in chat. Nothing in Bibi reads structured output from a model.
- Every AI feature is listed in `AI_FEATURES` and needs a model chosen by a superadmin. Tests never call paid AI: Vitest uses a mock model and E2E uses `E2E_MOCK_MODEL`.
- A draft must never become a booking without a person checking it. Staff must be able to see where every value came from, and which values were guessed.

## Decision
1. **A new query, `orderDraft.fromMessage`**, takes `{ text }` (pasted) or `{ inboundMessageId }` (ADR 0085: a message of any channel; structured form fields are taken as given). It returns a **draft** and writes nothing.
   - Permission: `order:write`, since it only serves creating an order. `inboundMessageId` also needs `inbox:read`.
   - It is on every surface, so the assistant and API clients use the same draft.
2. **The draft is per field, with evidence.** Each field is `{ value, quote, guessed }`:
   - `quote` is the exact text the value came from. If the model's quote is not found in the message, the field is marked guessed.
   - `guessed` is true when the value was inferred rather than stated, for example an end time when only the start was given.

   The fields are: sender and company, date, start, end, headcount, the wish in the customer's words, a suggested package, needs as counts, and notes.
3. **Ids are never invented.** The model returns text. Core resolves it:
   - Customer: by the sender's email domain, then by name, through `customer.findSimilar` (ADR 0081); public domains are ignored (ADR 0078).
   - Contact: by email at that customer.
   - Package: chosen only from the organization's active packages, which are passed to the model as a list and checked against it.
   - Needs: only from the organization's active list values, the same way.

   An unmatched value stays as text, and the intake asks for it.
4. **Times are resolved by core, not the model.** The model returns the date and time as written, plus a normalised local value. Core turns it into an instant in the organization's zone (ADR 0064). A date without a year resolves to the next such date after the message was received, or after today for pasted text.
5. **AI output is Zod-validated** at the boundary like any input. Output that does not fit the schema gives `UNAVAILABLE` with nothing extracted, and the intake falls back to manual entry.
6. **It is an AI feature**, `order.intakeDraft`, in `AI_FEATURES`. A superadmin chooses its model in `/admin/ai-models`; without a model the operation returns `UNAVAILABLE` and step 0 is hidden. Core calls the model through an injected `extract` port, the way `search` uses `embed`, so core does not depend on the AI SDK. The port uses the AI SDK's structured output through the gateway.
7. **Privacy and logging.** The message text goes to the gateway and nowhere else. The draft is not stored. The system log records the event, the feature, the length and the outcome, never the text or the extracted values.
8. **The person pressing Create is the approval** (ADR 0007). The draft fills steps 1–3 of the intake and marks those values "from email". Every guessed value becomes an open question that blocks Create (ADR 0081). The order's audit and history record that it was drafted from a message, with the mail id when there is one.
9. **In chat**, a system skill `intake-from-message` calls `orderDraft.fromMessage` through MCP. It asks about the guessed values with `ask_question`, then proposes `order.create` as an approval card. The skill gets no special path into the service layer.

## Consequences
- The first use of structured output: the port in `packages/ai`, mock responses for Vitest and `E2E_MOCK_MODEL`, a seed row in `ai-models.ts` and i18n labels for the feature.
- Intake step 0 (paste, or open from the inbox) shows "What the assistant read" with value, quote and a mark on guessed values.
- `customer.findSimilar` (ADR 0081) is a dependency; so is the inbox (ADR 0085), but only for `inboundMessageId`.

## Alternatives rejected
- **Let the assistant fill the form through chat only.** Rejected: staff work in the intake page, and a chat round trip per field is slower than a draft with evidence. Chat still gets the same draft through the skill.
- **Let the model pick customer, package and need ids.** Rejected: a model can invent or confuse ids. Matching is deterministic in core, and the model only reads text.
- **Create the order directly from the email.** Rejected: AI proposes and a person confirms (ADR 0007). Spam and half-formed requests would become orders.
- **Store the draft.** Rejected: no new lifecycle. The browser draft (ADR 0081) keeps an unfinished intake.
