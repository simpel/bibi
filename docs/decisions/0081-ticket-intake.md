# 0081 – Ticket intake: one page, packages or one-off, reviewed before Create

- **Date:** 2026-11-01
- **Status:** Accepted (approved by the user on 2026-11-01)
- **Related:** 0043 and 0067 (predefined tickets, start status), 0044 (soft holds, no queue), 0052 (the line is the booking), 0053 (holds are a projection), 0059 (capabilities, demands, pools), 0064 (time), 0071 (view read models), 0078 (domain join), 0003 (parity), 0007 (AI proposes, the user confirms). Companion ADRs: 0082 (option quantities), 0083 (organization inbox), 0084 (draft from a message)
- **Spec:** `docs/specs/ticket-intake.md`. Plan: `docs/plans/ticket-intake.md`. Click prototype: https://claude.ai/artifact/Hmdk44ucTDo135fGNbeqqH

## Context
- `/new/ticket` is two unrelated forms: a short form from a predefined ticket, else a wizard (type, customer and details, own fields) that ends in a ticket with no lines. Lines are added later on the ticket page, one save at a time.
- Requests are not always about a room. A venue sells a wine tasting, a picnic basket or a guided tour as often as a meeting room. Staff ask in a fixed order: who, when and for how many, then what. "What" is a package the venue has prepared or a one-off made of lines.
- Staff need to see whether it fits before they book: other bookings on the same resources, guest limits, stock, and the rest of the day. Today availability is visible only after the ticket and its lines exist, and only hard collisions are reported.
- `ticket.createFromTemplate` already plans lines, pre-checks hard collisions on a generic list of planned lines and writes the ticket and its lines in one transaction. `ticket.create` writes a ticket only, with an optional contact and no note.
- Nothing previews lines without writing them. Soft overlaps, setup capacity and pool shortage are never reported.

## Decision
1. **One intake page** at `/new/ticket` with steps: **(0) start from a message** (optional, ADR 0084), **(1) who**, **(2) when and how many**, **(3) package or one-off**, **(4) review** (for a package) or **build the booking** (for a one-off). Done steps collapse to a summary with Change. It replaces the wizard and the short form. Nothing is written until Create, except a customer or contact created inline in step 1.
2. **Customer and contact are required for every new ticket**, in core: `ticket.create` and `ticket.createFromTemplate` need a `contactId` that works at the customer, on every surface. Existing tickets are not changed, and `ticket.update` cannot clear the contact. A customer can be created inline with its first contact in one command (`customer.create` with a nested `contact`).
3. **Duplicate customers are suggested, not prevented.** Before a new customer is created, `customer.findSimilar({ name?, email? })` returns customers with a similar normalised name (case, punctuation and legal suffixes such as AB or Ltd ignored) or whose contacts share the email's domain, unless the domain is a public one (`PUBLIC_EMAIL_DOMAINS`, ADR 0078). Staff choose one or confirm the new customer.
4. **"Package" is the UI name for a predefined ticket** (`TicketTemplate`; code and API names stay). A package gets an optional **guest range** (`minGuests`, `maxGuests`, owned).
5. **Step 3 groups packages** for the requested period and headcount: **available** (fits, no clash; warnings allowed), **clashes with other bookings**, and **outside the time or guest range** (the guest range, or the package runs past the requested end). A package that is outside the range is in that group even if it also clashes. Every group can be picked. Picking a package that needs a follow-up opens a dialog that asks **one question at a time**:
   1. guests outside the range: change the headcount, or keep it;
   2. runs past the requested end: extend the requested period, or keep it and shorten lines in review;
   3. clashes: move the request to the first start where nothing clashes, or keep the time and prebook.
   Cancel leaves the package unpicked.
6. **Every intake ends in review.** A package's planned lines, or a one-off's lines, are draft lines that staff edit before Create. A line is added and edited in a **line dialog**: an item of any type found by search, or free text; time; quantity that follows the headcount unless set; setup; choices with quantities (ADR 0082); needs as counts (Requirements); price and discount overrides; a note. The fields shown follow the item type's capabilities (ADR 0059).
7. **A new read, `ticket.previewLines`** (query, `ticket:read`; availability details need `item:read`, ADR 0071), plans lines without writing anything and returns them with their **issues**. Input: the customer, the requested period and headcount, and either `templateIds` (the package cards) or draft `lines`. Per line it returns the effective times, quantity and price, and these issue kinds:
   - `HARD_CLASH` with the blocker's ticket reference and period;
   - `SOFT_OVERLAP`;
   - `SELF_OVERLAP` (two lines of the draft on one resource);
   - `SETUP_CAPACITY` (quantity above the setup's capacity);
   - `POOL_SHORT` (fewer free units than needed);
   - `OUTSIDE_HOURS`.
   Per package it returns its group, `GUESTS_OUTSIDE_RANGE`, `PAST_REQUESTED_END` and the first clash-free start on the requested day. The planning of `ticket.createFromTemplate` (line planning and collision check) moves into one shared module used by the preview and by create.
8. **Intake always starts in the entry status**, so lines take the entry status's states from the grid, which are soft in a normal setup. **A clash is prebooked, never refused**: soft holds may overlap (ADR 0044). If the entry state of a line is hard and it clashes, the preview reports it and Create refuses it, as today. A package's own start status is used only by `ticket.createFromTemplate`.
9. **`ticket.create` creates the ticket and its lines in one command.** It gains:
   - `note`: booking-level notes;
   - `templateId`: provenance, so the first status change is recorded with trigger `TEMPLATE`;
   - `lines[]`: the `line.create` details plus `options[{ itemId, quantity? }]` (ADR 0082) and `requirements[{ vocabularyValueId, quantity }]`.

   Everything is written, or nothing. `ticket.createFromTemplate` becomes a thin wrapper on the same path and keeps the template's start status.
10. **Open questions block Create; clashes and warnings do not.** The review lists every open question with its answers, and Create stays disabled until each is answered. The questions:
    - the start moved after lines exist: move the lines, or keep their times;
    - choices or needs exceed a line's quantity;
    - a pool is short: accept the shortage, or lower the quantity;
    - a line has quantity 0;
    - the ticket has no lines: create a lead without lines?;
    - a value the assistant guessed (ADR 0084);
    - a required own field of the ticket type is empty;
    - a package name is missing when saving as a package.

    These are web logic, derived from the preview and the draft. Core still validates every input.
11. **Re-check at Create.** Create plans again inside its transaction. A new hard clash returns `CONFLICT` with `lines.<index>` issues, and the page previews again and shows what changed since the preview staff saw. Create carries an `intakeKey`, so a repeated submit returns the first ticket instead of creating a second one.
12. **Booking-level notes** are a new owned column, `Ticket.note` (text, at most 4000 characters), set by `ticket.create` and `ticket.update` and shown on the ticket page and on sheets. Line notes stay.
13. **Calendar snapshot.** Step 4 shows the requested day for the bookable resources the lines use: other bookings (hard and soft) from `calendar.range` (which gains an `itemIds` filter) plus the draft lines from the preview. The range widens to cover every line, past midnight included.
14. **One-off specifics.** The ticket type is asked only when the organization has more than one active ticket type, and the type's required own fields are asked in step 4. "Also save these lines as a package" creates a package from the draft after the ticket is created, with each line's offset taken from the requested start and the headcount-following quantity kept (`ticketTemplate.create`; no new command).
15. **Local draft.** An unfinished intake is kept in the browser (per organization and member) and offered on the next visit. Nothing is held or booked by a draft.

## Consequences
- Core gets:
  - the shared planning module;
  - `ticket.previewLines`;
  - the extended `ticket.create`;
  - `customer.findSimilar`, `customer.create` with a nested contact, and `customer.list` with `recent`;
  - `calendar.range` with `itemIds`;
  - `Ticket.note` and the template guest range.
  
  Every new operation and field is on web, GraphQL, REST and MCP (ADR 0003), with approval labels, isolation tests and parity.
- Making the contact required changes every seed, test and API client that creates a ticket without one. They are fixed in the same change.
- `ItemSetup.capacity` and pool free units become checked (as issues), not only stored.
- The web intake is new: a one-page step layout, an async customer search, a time field, a draft line dialog reusing the program field components, an open-questions panel and the calendar snapshot. The wizard, the short form and the `?mode=custom` link go.
- The demo seed gets packages with guest ranges, non-room items, clashing bookings, contacts with company email domains and a near-duplicate customer.

## Alternatives rejected
- **A wizard, one step per screen.** Rejected: staff jump back and forth on the phone, and step 4 needs steps 1–3 visible as context.
- **Create the ticket first, then add lines on the ticket page.** Rejected: an interrupted call leaves an empty lead, and availability shows only after the ticket exists.
- **`ticket.create` followed by one `line.create` per line from the client, or a change set from the web.** Rejected: not atomic from the page, every surface would repeat the sequence, and re-checking would be spread over many calls.
- **A persisted server draft ticket.** Rejected: a second lifecycle for one page. A browser draft covers dropped calls.
- **Refusing a clash, as `createFromTemplate` does.** Rejected: staff often want to prebook and sort the other booking out, and soft holds already allow overlap without a queue (ADR 0044).
- **Keeping the package's start status in intake.** Rejected: a hard start status would turn every clash into a refusal. Packages keep their status for `createFromTemplate`.
- **A per-item capacity (e.g. a sommelier for at most 16).** Not now: the package guest range and setup capacity cover the cases seen. It can be added as an item setting later.
