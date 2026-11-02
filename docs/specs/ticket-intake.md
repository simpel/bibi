# Ticket intake

Behaviour spec for ADR 0081 (with 0082, 0084, 0085), all Accepted, not built yet. Tickets, statuses and line states: `docs/specs/tickets-statuses-and-states.md`. Entities: `docs/domain-model.md`. The click prototype shows every state below: https://claude.ai/artifact/Hmdk44ucTDo135fGNbeqqH

## The page
- `/new/ticket`, permission `ticket:write`, opened from the create hub, the ticket list and an inbox message (`?fromMessage=<id>`).
- **The open step is in the path**: `/new/ticket` (step 1, the start), `/new/ticket/message`, `/new/ticket/when`, `/new/ticket/package`, `/new/ticket/review`. An unknown step is not found; the older `?start=message` redirects to `/new/ticket/message`.
  - Every step change (Next, Change, a step completed by itself, Back to review) adds a history entry without reloading the page, so the browser's Back and Forward move between steps. A step the intake cannot open yet opens the first step still missing input, and the URL follows.
  - A reload restores the state: past the start (or on an inbox message's intake, whose draft is its own) the local draft is restored without asking and opens the URL's step, or the first step still missing input (e.g. `/when` without a customer opens step 1).
- One page with steps in order: 0 start from a message (optional), 1 who, 2 when and how many, 3 package or one-off, 4 review / build the booking.
  - Only the open step takes input.
  - A done step collapses to a one-line summary with **Change**, which reopens it and keeps later answers.
  - Values that came from a message say "from email".
- Nothing is written until **Create**, except a customer or contact created in step 1.
- **Local draft**: the page keeps the unfinished intake in the browser, per organization and member, written on every change. On the next visit to plain `/new/ticket` the first step offers "Continue the draft for <customer> (<date>, <guests> guests)?" with Continue and Discard. A created ticket clears it.

## 0 · Start from a message
- Shown when opened from an inbox message, or when the person chooses "Start from a message". It is hidden when the organization has no model for `ticket.intakeDraft`.
- A text area (prefilled from the inbox message) plus **Read the request** and **Fill in by hand instead**.
- Reading calls `ticketDraft.fromMessage`.
  - The result fills steps 1–2, suggests a package, and sets needs and notes, then opens step 3.
    - Step 1 is filled only when both the customer and the contact were matched; otherwise the search starts with the company or sender. Step 2 is filled when the date, both times and the guests were read; otherwise its fields are prefilled.
    - The wish, the notes and the needs ("Needs: Vegan × 2") start the booking note; needs per line are set in the line dialog.
    - An inbox message left as it came is read by id, so its sender and form fields are taken as given; edited text is read as pasted. Until endpoints map their own form fields, the field names `name`, `company`, `email`, `phone`, `date`, `start`/`from`, `end`/`to` and `guests`/`headcount` are used.
  - A panel, **What the assistant read**, lists each field with its value and its quote from the message. Guessed values are marked.
  - The panel can be hidden.
- Every guessed value becomes an open question in step 4.
- If extraction fails (`UNAVAILABLE`), the page says so and continues by hand.

## 1 · Who
- **Customer, required.** A search (name) that shows only the 5 most recent customers while empty (`customer.list` with `recent`), and matches plus **+ New customer** while typing.
- **Picking a customer** (a match, a recent one, a "looks like" suggestion or a just-created one) opens step 2 at once with its default contact. Only a customer without a contact keeps step 1 open to add one.
- **+ New customer "<text>"**:
  - First calls `customer.findSimilar`. A match shows "“<text>” looks like <customer>" with **Use <customer>** and **No, it is a new customer**.
  - The new-customer form asks for name, customer type, contact name and contact email, all required. It runs `customer.create` with the nested contact and selects the result.
- **Contact, required.** Defaults to the customer's only or first contact; with several, **Change** on step 1 shows a picker.
  - A customer without a contact shows "<customer> has no contact person. Add one to continue." with name and email. It runs `contact.create`.
- **Changing the customer after step 4 exists**: lines are kept, prices are re-derived for the new customer's price list, and the review shows "Prices updated for <customer> (<price list>). Lines with a manual price keep theirs. Total changed by <diff>", which can be dismissed.

## 2 · When and how many
- Date, from, to (times in the organization's zone, ADR 0064) and estimated guests. They become `desiredStartsAt`, `desiredEndsAt` and `estimatedHeadcount`.
- **Next: packages**, or **Back to review** when lines exist.

## 3 · Package or one-off
- `ticket.previewLines` with every active package (`templateIds`) gives each card its group and notes.
- Each card shows: name, summary, guest range, and notes (✓ available, ⚠ a warning, ✕ clash text or count, the guest range against the requested headcount, "Runs to <time>, past <requested end>").
- **Groups**, each hidden when empty except the first:

| Group | When |
|---|---|
| Available <date> <from>–<to> for <guests> | No hard clash, inside guest range and requested period. Warnings allowed. Holds the **One-off** card too. |
| Not available then · clashes with other bookings | At least one hard clash, inside the ranges. |
| Outside your time or guest range | Outside the guest range or past the requested end, whatever else applies. |

- **A suggested package** (from a message) is marked "★ Suggested from the email".
- **Picking a package** that needs a follow-up opens a dialog, one question at a time ("question 1 of 3"):
  1. **Guests outside the range**: "Lower/Raise the booking to <n> guests", or "Keep <n> guests (lines over capacity are flagged)".
  2. **Runs past the requested end**: "Extend the ticket to <end>", or "Keep <to> and shorten the lines in review".
  3. **Clashes**: "Move the booking to <start>–<end> (first free time)" (shifts from and to by the same amount; offered when `firstFreeStart` exists), or "Keep the time and prebook (blocked until resolved)".

  **Cancel, pick another package** leaves nothing picked. When done, a summary line shows the package and the answers.
- **One-off** needs no dialog. **Next** is disabled until a package is picked with every question answered, or One-off is picked.
- **Switching** when lines already exist:
  - to another package asks **Replace the lines** or **Add its lines to them**;
  - to a one-off asks **Keep them and edit** or **Start empty**.
- **No packages at all**: the step says "No packages yet" and offers One-off and Create a package.

## 4 · Review the booking (package) / Build the booking (one-off)
- **Header**: customer, date, guests, "nothing is saved until Create".
- **One-off only**:
  - Ticket type, asked only when the organization has more than one active ticket type.
  - The type's required own fields.
  - An empty state ("Nothing added yet") with quick-add buttons for the most used items.
- **Calendar snapshot**:
  - The requested day, from 08:00–20:00 or wider to cover every line (past midnight marked "+1").
  - One row for this ticket's program, then one row per bookable resource the lines use. Each resource row shows other bookings (hard dark, soft light, labelled with ticket and customer) and this ticket's draft lines (dashed, red when they clash).
  - Pool and stock shortages are listed under it.
  - The view updates as lines change. **Open calendar** links to the full calendar on that day.
- **Lines table**: time, line (name, then a second row with setup, choices, needs, price override and note), quantity ("12 (guests)" or a fixed number), availability (✓, ⚠ or ✕ with the issue text), **Edit**.
- **+ Add line** opens the line dialog empty. **Edit** opens it with the line.
- **Notes on the booking**: a text area, becomes `Ticket.note`.
- **One-off only**: **Also save these lines as a package**, with a name.
- **Blocked lines summary**: "<n> lines clash with other bookings. They are prebooked (soft hold) and stay blocked until you move the time or the other booking is freed."
- **Open questions** (yellow panel, each with its answers). Create shows "Answer <n> questions first" until all are answered.

| Question | Answers |
|---|---|
| The start changed from <a> to <b>. What should happen to the lines? | Move every timed line <±delta> · Keep the line times |
| There are no lines. Create the ticket as a lead without lines? | Yes, a lead without lines · + Add a line |
| <line> has quantity 0. | Remove the line · Edit line |
| <line>: <n> choices (or needs) but only <q> ordered. | Lower to fit · Edit line |
| <line>: <q> needed, only <free> left that day. | Prebook all <q> (source <q−free> more) · Lower to <free> |
| The email doesn't say <field>. The assistant guessed <value>. | Keep <value> · Change it |
| <type> tickets need <field>. | (fill the field) · Use another ticket type |
| The new package needs a name. | (fill it) · Don't save as a package |

- **More** (collapsed): assignee (default: the creating member), holds until, estimated value.
- **Create**:
  - The label is **Create ticket**, or **Create and prebook** when lines clash. While saving it shows "Creating…" and is disabled.
  - It runs `ticket.create` with the lines, the note, `templateId` and `inboundMessageId`, and an `intakeKey`.
  - On `CONFLICT` for a new clash, nothing is created. The page previews again and shows "Not created yet. Since you started, #<ref> booked <resource> <period>. The lines and calendar are updated. Check them and create again."
  - After create, with "save as package" ticked, it runs `ticketTemplate.create`. A failure there shows a toast; the ticket stays.

## The line dialog
- **What**: a search across every active item of every type. Each result shows its type and its availability at the ticket's start. **+ Free-text line** adds a line with no item. In edit, **Change item** returns to the search.
- **Line**:
  - Name, editable.
  - Date: the ticket's, shown read-only.
  - From and to: empty means untimed.
  - Quantity: shows the headcount while it follows it ("One per guest: changes if the guest count changes"). Typing a number fixes it ("Fixed at <n>"). **Use the guest count (<n>)** returns to following.
- **Fields by capability** (ADR 0059):

| Capability | Fields |
|---|---|
| `BOOKABLE` | Time, availability for that time |
| `SETUPS` | Setup (capacity shown) |
| `CUSTOMISATIONS` | Choices per group: a pick in a normal group, a quantity per option in a split group (ADR 0082) |
| `PRICED` | Unit price (list price shown as the placeholder), discount |

- **Needs**: counts per value from the organization's lists (Vegan 2, Nut allergy 1), stored as line Requirements.
- **Note** (shown on sheets).
- **Availability box**: the preview's issues for this line, live. A hard clash says "You can still save; the line is prebooked and shown as blocked."
- **Footer**: **Remove line** (edit only), Cancel, Add line or Save.

## The ticket page after Create
- Header, status (the entry status), assignee, period, guests, contact and "from package <name>" or "One-off".
- The booking notes. "Ticket created with <n> lines", or "as a lead without lines", plus "<n> lines blocked: resolve before confirming" when lines clash.
- With a message: "<sender>'s email is attached to the ticket's inbox. Drafted by the assistant from the email, checked and created by you."
- Next actions: Add line, Send quote, Payment link, Hold until.

## Core
- `ticket.previewLines`, `ticket.create` (with `lines`, `note`, `templateId`, `inboundMessageId`, `intakeKey`; contact required; starts in the entry status), `ticket.createFromTemplate` (same path, template start status, contact required): ADR 0081.
- `customer.findSimilar`, `customer.create` with `contact`, `customer.list` with `recent`, `calendar.range` with `itemIds`: ADR 0081.
- `line.chooseOptions` with `options[{ itemId, quantity? }]`, split groups, `OPTION_SPLIT_MISMATCH`: ADR 0082.
- `InboundMessage` and `InboundEndpoint`; `inboundMessage.list|get|attachToTicket|dismiss|restore|submit`, feature `inbox` (read, write, submit); EMAIL channel built, WEB_FORM and SMS designed: ADR 0085.
- `ticketDraft.fromMessage`, AI feature `ticket.intakeDraft`: ADR 0084.
- All on web, GraphQL, REST and MCP (ADR 0003).
