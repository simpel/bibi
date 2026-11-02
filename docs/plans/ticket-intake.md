# Plan (draft): ticket intake, end to end

Status: accepted 2026-11-01 (ADRs 0081–0084 accepted). The design is settled in the click prototype (flows A package, B one-off, C from an email): https://claude.ai/artifact/Hmdk44ucTDo135fGNbeqqH. Not an ADR. Facts marked **verified** were read in code on 2026-11-01; the rest is a decision or a proposal. Work starts with slice 0 (ADRs), which the product owner accepts before anything is built (ADR 0075).

## Goal
Staff create a ticket in one page: customer, when and how many, then a package or a one-off, then review and edit every line with its availability in context, then Create. Nothing is written before Create, a clash never stops a booking (it is prebooked), and an open question always does. The same intake can start from a customer's email, read by the assistant into a draft that staff check.

## Decisions (made by the product owner)
1. **One page, five steps**: (0) start from a message, optional; (1) who; (2) when + how many; (3) package or one-off; (4) review / build the booking. Done steps collapse to a summary with Change. Create opens the ticket page.
2. **Customer and contact are required.** The contact rule lives in core: every new ticket on every surface needs `contactId`. Existing tickets are untouched. A new customer is created inline with name, type, contact name and contact email. A near-duplicate name or email domain is suggested before a new customer is created.
3. **Packages** (the UI name for `TicketTemplate`, replacing "Predefined ticket") get a **guest range** (min, max). Step 3 shows three groups for the requested period and headcount: **available**, **clashes with other bookings**, **outside the time or guest range**. All three can be picked.
4. Picking a package that needs a follow-up opens a **dialog, one question at a time**: guests outside the range (change or keep, flagged); runs past the requested end (extend or keep and shorten); clashes (move to the first free start, or keep and prebook).
5. **Packages are reviewed too.** Both paths end in step 4 with editable draft lines. Lines are added and edited in a **line dialog**: item search across every type or free text, time, quantity that follows the guests unless set, setup, choices, **needs as counts**, price, discount, note.
6. **Diet and allergy counts are Requirements** (needs as counts, already modelled), and **choices get quantities** (10 fish, 4 vegetarian): an option line can have its own quantity. This amends ADR 0059.
7. **A clash is prebooked, never refused.** Intake always starts the ticket in the **entry status**, so lines get the entry status's (soft) states; a package's own start status is not used by intake.
8. **Open questions block Create; clashes do not.** Questions: time moved after lines exist (move lines or keep), choices or needs exceed the quantity, short stock (accept shortage or lower), quantity 0, no lines (create a lead?), a guessed value from an email, a required own field, a package name missing.
9. Step 4 shows a **calendar snapshot** of the day for the bookable resources the lines use, with other bookings (hard and soft) and the draft lines; the range widens to cover every line.
10. **Booking-level notes** on the ticket (a new owned column), shown on the ticket page and sheets. Line notes stay.
11. **Re-check at Create**: if anything changed since the preview, Create stops, shows what changed and the lines are re-evaluated. Double submit is impossible.
12. **Local draft**: an unfinished intake is kept in the browser and offered on the next visit. Nothing is held or booked.
13. A **one-off** asks for the ticket type only when the org has several, asks the type's required own fields, and can be **saved as a package**.
14. **From an email**: paste a message, or open one from the new **organization inbox** (mail to the org address that matches no ticket). The assistant extracts customer (by contact email domain), contact, date, start, end, guests, a suggested package, needs and notes, each with its **source quote**; guesses are marked and become open questions. Create is the human approval. The email is attached to the ticket. The inbox amends ADR 0012.

## What exists (verified)
- `ticket.create` creates a ticket only; `contactId` optional; no note column (`packages/core/src/features/ticket/schema.ts:50-90`, `packages/db/prisma/schema/ticket.prisma`).
- `ticket.createFromTemplate` plans lines (`plan-template-lines.ts`, pure), pre-checks hard-hold collisions on a generic `PlannedLine[]` (`template-collisions.ts:43-70`, now `plan/hard-collisions.ts`), then `insertTicket` + `insertLine` in one transaction. Reusable for arbitrary draft lines. It does not catch two planned lines colliding with each other (the DB trigger does) or pre-check mandatory demands.
- Line warnings are derived on read: only unfilled optional demand and outside item/venue hours (`line/warning-schema.ts`). Soft overlap, setup capacity and stock are never reported. `ItemSetup.capacity` is stored but unchecked.
- `item.freeUnits` answers pool availability (hard holds only); `calendar.range` is the view read model for blocks and per-day values (no `itemIds` filter; max 62 days); `occupancy.list` gives raw rows.
- Choices: `line.chooseOptions` stores option lines with `parentLineId`, quantity = parent's, at most once per option (`choose-options-schema.ts:4-15`).
- `TicketTemplate` has no guest range (`ticket-template.prisma`). `ticketTemplate.create` takes lines with offsets, so "save as package" needs no new command.
- Customers: no duplicate detection; `customer.list` has a name `query`; `PUBLIC_EMAIL_DOMAINS` exists (`packages/core/src/organization/email-domain.ts`).
- No preview op for lines; `dryRun` and `previewChange` exist (rolled-back transaction).
- Inbound mail: only `ticket-<id>@`, `InboundEmail.ticketId` required, unmatched mail is dropped (ADR 0012).
- AI: only `streamText` in chat; no structured output anywhere. A new AI feature needs an `AI_FEATURES` entry, a chosen model in `/admin/ai-models` and a seed row. Tests blank the gateway key; E2E uses `E2E_MOCK_MODEL`.
- Web: current intake is `ticket-create.tsx` (wizard or template short form). The line dialog saves straight away (needs a `ticketId`), but its field components take a form and can be reused for drafts. `AvailabilityCalendar`, `TicketLanes`, `clashesOf`/`freeSlotAt` exist for saved lines. There is no async combobox, time-only field or step-section component. No E2E covers `/new/ticket`.
- ADR number 0080 is taken; next free is **0081**.

## ADRs and spec (slice 0)
- **0081 Ticket intake**: decisions 1–5, 7–13; `ticket.previewLines`; `ticket.create` with lines; contact required; entry-status start; open questions vs clashes. Rejected: wizard per step; create-then-add-lines; client-side chain of `line.create`; persisted server drafts.
- **0082 Option quantities** (amends 0059): an option line may carry its own quantity; group rules count quantities; pricing and quote snapshots per option line.
- **0083 Organization inbox** (superseded by **0085 Inbound messages from any channel**, accepted): an org address, unmatched mail stored without a ticket, attach to a ticket, never fabricated by users or AI.
- **0084 Extracting a draft from a message**: first structured-output AI feature, a query that writes nothing, quotes and guesses in the output, Zod-validated, Create as the approval.
- Spec `docs/specs/ticket-intake.md`; `docs/domain-model.md` and `docs/artifacts/domain-model.html` together.

## Core design
- **Shared planning module** `features/ticket/plan/`: turns a package or draft lines into planned lines (times in the item's venue zone, ADR 0064), resolves effective quantity, price and the entry-status state, and collects **issues** per line: `HARD_CLASH` (with blocker ticket ref and period), `SOFT_OVERLAP`, `SELF_OVERLAP`, `SETUP_CAPACITY`, `POOL_SHORT`, `OUTSIDE_HOURS`, `REFUSED_HARD` (the entry state is hard and clashes). Package-level: `GUESTS_OUTSIDE_RANGE`, `PAST_REQUESTED_END`, `firstFreeStart`. `createFromTemplate`'s planning and collision code moves here.
- **`ticket.previewLines`** (query, `ticket:read`, availability parts gated by `item:read`, ADR 0071): input period, headcount, customerId, and `templateIds` (cards) or `lines` (draft); output planned lines with issues and per-package group. Writes nothing; no locks.
- **`ticket.create`** gains `note`, `templateId` (provenance; history trigger `TEMPLATE`) and `lines[]`: line details plus `options[{ itemId, quantity? }]` and `requirements[{ valueId, count }]`. All or nothing; start status is always the entry status; contact required. `createFromTemplate` becomes a thin wrapper on the same path and keeps its template start status (API and assistant use).
- **Re-check**: the transaction re-runs the planning; a new `HARD`/`REFUSED_HARD` issue returns `CONFLICT` with `lines.<index>` issues, and the web re-previews to show the difference. A client `intakeKey` makes Create idempotent.
- **Customers**: `customer.create` accepts a nested first `contact`; `customer.findSimilar({ name?, email? })` (normalised name, legal suffixes stripped, plus contact-email domain outside `PUBLIC_EMAIL_DOMAINS`); `customer.list` gains `recent: true` (by latest ticket).
- **Calendar**: `calendar.range` gains `itemIds`.
- **Inbound messages (0085, replaces the 0083 design)**: `InboundMessage` + `InboundEndpoint`, one SYSTEM `inboundMessage.receive` behind channel adapters, `inboundMessage.submit` for the API channel. Was (0083): `InboundEmail.ticketId` nullable plus `organizationId` address scheme; `inboundEmail.listInbox`, `attachToTicket`, `dismiss`; `receive` stays SYSTEM-only.
- **Extraction (0084)**: `ticketDraft.fromMessage({ text } | { inboundMessageId })`, a query behind an injected `extract` port (as `embed` is), output a draft with `{ value, quote, guessed }` per field and matched ids; AI feature `ticket.intakeDraft`.

## Slices (each one commit to main through the `implement` skill, verify green, seed updated)
| # | Slice | Depends on | Size |
|---|---|---|---|
| 0 | ADRs 0081–0084 + spec + domain model, **accepted by the product owner** | – | 0.5 d |
| 1 | Foundations: `Ticket.note`, template guest range, contact required in core (seed + tests), `calendar.range.itemIds`, UI rename "Predefined ticket" → "Package" | 0 | 1 d |
| 2 | Option quantities (0082): schema, `chooseOptions`, group rules, pricing, quotes, sheets | 0 | 1.5 d |
| 3 | Planning module + `ticket.previewLines` with every issue kind, heavy unit tests | 1 | 1.5 d |
| 4 | `ticket.create` with lines, options, requirements, note, entry-status start, re-check, idempotency; `createFromTemplate` on the same path | 2, 3 | 1 d |
| 5 | Customers: nested contact, `findSimilar`, `recent` | 1 | 0.5 d |
| 6 | Web A: one-page shell (new step-section and time field in `@bibi/ui`), who (async search, recent, inline new + duplicate check), when, package groups + follow-up dialog, local draft | 3, 5 | 1.5 d |
| 7 | Web B: review: draft table, line dialog (search across types, capability fields, option quantities, needs), calendar snapshot with draft overlay, open questions (pure function, unit-tested), notes, one-off + type + own fields, save as package, Create + re-check; remove the wizard and short form | 4, 6 | 2.5 d |
| 8 | Inbound messages (0085, accepted; replaces 0083): `InboundMessage` + `InboundEndpoint`, backfill of `InboundEmail`, EMAIL adapter (org address + ticket replies), `inboundMessage.submit` (API channel), inbox page, "New ticket from this message" (**built**) | 1 | 1.5 d |
| 9 | Extraction (0084, amended by 0085): AI feature, port, structured output, mock model, form fields taken as given, step 0 UI with quotes and guesses, system skill for chat | 4, 5, 8 | 1.5 d |
| 10 | Showcase seed (packages with ranges, non-room items, a stock pool, clashing bookings, contact domains, a near-duplicate customer, inbox mail) + Playwright for flows A, B, C + user guide | 7, 9 | 1 d |

About **13 working days**. Core slices (1–5, 8) are Opus work and run alone; 2 and 5 can run in parallel after 1; 8 can run any time after 1. Web slices start when their core contracts are on main. The main session owns integration and the parity test.

## Risks
- **Contact required** breaks API clients and every seed or test that creates a ticket without one; slice 1 fixes them all in one go.
- **Option quantities** touch quote and invoice snapshots (`OrderLine`); a quantity per option line must survive `quote.send`.
- **Preview cost**: one call plans every package for the cards; it must batch occupancy reads per item and day, not per line.
- **Time zones**: draft lines carry wall times; planning converts per item venue (ADR 0064). The calendar snapshot uses the same conversion.
- **File limits** (150/40): the intake UI splits into many small files per step; the open-questions logic and the draft reducer stay pure and tested.
- **Item capacity** (e.g. a sommelier for at most 16) is not modelled; v1 uses the package guest range and setup capacity only.

## Out of scope for this plan
- Consumable stock without pool units (e.g. picnic baskets as a count).
- Calendar-started intake, copy a previous booking, multi-day packages with per-day headcounts.
- Server-side drafts across devices.
