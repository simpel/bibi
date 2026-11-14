# Order intake

Behaviour spec for ADR 0081 (with 0082, 0084, 0085, 0088, 0089), all Accepted, not built yet. Orders, statuses and line states: `docs/specs/orders-statuses-and-states.md`. Entities: `docs/domain-model.md`. The click prototype shows every state below: https://claude.ai/artifact/Hmdk44ucTDo135fGNbeqqH

## The page
- `/new/order`, permission `order:write`, opened from the create hub, the order list, an inbox message (`?fromMessage=<id>`) and a free slot on the calendar (`?slot=<item>&date=&from=&to=`, see "Starting from the calendar").
- **The open step is in the path**: `/new/order` (step 1, the start), `/new/order/when`, `/new/order/package`, `/new/order/custom` (only for a custom booking), `/new/order/choices` (only while the intake has the choices step), `/new/order/review`. `/new/order/message` is step 1 with the paste dialog open (see "Reading a message"), not a step; once the dialog closes the path becomes the open step's (`?fromMessage=` kept, the dialog's path replaced, not pushed). An unknown step is not found; the older `?start=message` redirects to `/new/order/message`.
  - Every step change (Next, Back, Change, a step completed by itself) adds a history entry without reloading the page, so the browser's Back and Forward move between steps. A step the intake cannot open yet opens the first step still missing input, and the URL follows.
  - A reload restores the state: past the start (or on an inbox message's intake, whose draft is its own) the local draft is restored without asking and opens the URL's step, or the first step still missing input (e.g. `/when` without a customer opens step 1).
- One page with steps in order: 1 who, 2 when and how many, 3 package, then for a custom booking the build step, then choices (only when a line has a required choice, ADR 0089), then review. Steps are numbered in the order they show: review is 4, 5 or 6.
  - Only the open step takes input. Its own commands sit right on its title row (shown only while open); its **Next** (Create in review) sits bottom right and a ghost **Back** bottom left; the labels never change (no "Next: packages", no "Back to review"). Next goes on to the next step, or straight back to review once later steps are done. Back opens the previous step like its Change (answers kept, the URL follows); step 1 has no Back.
  - A done step collapses to a one-line summary with **Change**, which reopens it and keeps later answers.
  - Values that came from a message say "from email" while they are still what the message said.
- Nothing is written until **Create**, except a customer or contact created in step 1.
- **Local draft**: the page keeps the unfinished intake in the browser, per organization and member, written on every change once a customer is chosen or a message was read. On the next visit to plain `/new/order` a banner above the first step offers "Continue the draft for <customer> (<date>, <guests> guests)?" with Continue and Discard. An inbox message's intake and each calendar slot's intake keep a draft of their own, so several drafts can exist side by side; a slot's draft is offered again when the same slot is picked. A created order clears it. Drafts stored before the paste dialog (version 2, possibly open on the old step 0) still load, opening step 1; drafts from before add-ons (version 3) load with none (ADR 0088).

## Reading a message (the paste dialog)
- The sidebar's New order menu has **From a message**, which opens `/new/order/message`: step 1 with a dialog over it. An inbox message's New order opens the same path with `?fromMessage=<id>`, the text area prefilled with the message. Without a model for `order.intakeDraft` the menu entry is hidden and the path just opens step 1.
- The dialog: a text area for the request, **Read the request** ("Reading the request…" while it runs) and Cancel.
- Reading calls `orderDraft.fromMessage`. On success the dialog closes and the steps start over **prefilled, none completed**; the person walks through them with Next and can change anything:
  - Step 1 shows the matched customer with its matched contact preselected and **Next** (no jump to step 2); without a match the search starts with the company or sender.
  - Step 2's fields hold the date, times and guests that were read.
  - Step 3 marks the suggested package "★ Suggested from the email" and preselects it, picked as a click would (its follow-up questions are asked).
  - The wish, the notes and the needs ("Needs: Vegan × 2") start the booking note; needs per line are set in the line dialog.
  - An inbox message left as it came is read by id, so its sender and form fields are taken as given; edited text is read as pasted. Until endpoints map their own form fields, the field names `name`, `company`, `email`, `phone`, `date`, `start`/`from`, `end`/`to` and `guests`/`headcount` are used.
- **What the assistant read**: a small button by the message banner opens each field with its value and its quote from the message. Guessed values are marked.
- Every guessed value becomes an open question in step 4.
- If extraction fails (`UNAVAILABLE`), the dialog says reading isn't available and offers **Fill in by hand**, which closes it.

## Starting from the calendar
- Drawing a free slot on a resource's row of `/calendar` opens a dialog (not the assistant): the resource as title, the day, **From** and **To** to adjust (a To at or before From ends the next day; equal is refused), **Create order**, **Ask the assistant** and Cancel.
- **Ask the assistant** keeps the earlier behaviour: the chat opens with "Book <resource> on <date> at <time>." in the composer.
- **Create order** opens `/new/order?slot=<item>&date=<day>&from=<HH:mm>&to=<HH:mm>`. A slot that does not parse is ignored and the plain intake opens. The query stays while the step path changes.
  - Step 1 opens as usual. Step 2 is prefilled with the day and times (none completed); the guests are still typed.
  - Step 3 lists only the active packages with a line that books the slot's resource. With none, the empty state says no package books this resource and points to Custom booking.
  - A new custom booking starts with one line of the resource over the order's period (the first line type), as quick-add would make it. Without `item:read`, or for an item no longer in the catalog, it starts empty.

## 1 · Who
- **Customer, required.** A search (name) whose list stays closed until the field is focused, then shows only the 5 most recent customers while empty (`customer.list` with `recent`), and matches plus **+ New customer** while typing.
- **Picking a customer** (a match, a recent one, a "looks like" suggestion or a just-created one) opens step 2 at once with its default contact. Only a customer without a contact keeps step 1 open to add one. A customer the step starts with (reopened by Change, or preselected from a message) shows its contact with **Next**, which is disabled until a contact is chosen.
- **New customer** on the title row opens the new-customer form empty; **+ New customer "<text>"** in the search opens it with the name.
  - The search's option first calls `customer.findSimilar`. A match shows "“<text>” looks like <customer>" with **Use <customer>** and **No, it is a new customer**.
  - The new-customer form asks for name, customer type, contact name and contact email, all required. A name not checked yet (typed in the form) is checked with `customer.findSimilar` on create, showing the same "looks like" choice in the form. It runs `customer.create` with the nested contact and selects the result.
- **Contact, required.** Defaults to the customer's only or first contact; with several, **Change** on step 1 shows a picker.
  - A customer without a contact shows "<customer> has no contact person. Add one to continue." with name and email. It runs `contact.create`.
- **Changing the customer after step 4 exists**: lines are kept, prices are re-derived for the new customer's price list, and the review shows "Prices updated for <customer> (<price list>). Lines with a manual price keep theirs. Total changed by <diff>", which can be dismissed.

## 2 · When and how many
- Date, from, to (times in the organization's zone, ADR 0064) and estimated guests. They become `desiredStartsAt`, `desiredEndsAt` and `estimatedHeadcount`.
- **Next** opens step 3, or the review again when lines exist. It is disabled while the date, times or guests break the step's rules (checked on every change); a field's message shows once it was touched. **Back** stays enabled.
- The date, times and guests sit on one line, aligned at the top whatever messages show under them. An empty date says "Choose a date".

## 3 · Package
- `order.previewLines` with every active package (`templateIds`) gives each card its tab and notes.
- Each card shows: name, summary, guest range, and notes (✓ available, ⚠ a warning, ✕ clash text or count, the guest range against the requested headcount, "Runs to <time>, past <requested end>").
- **Two tabs**, each with its count; the first is open unless it is empty and the second is not:

| Tab | Packages |
|---|---|
| Fits your request (<n>) | No hard clash, inside the guest range and the requested period. Warnings allowed. Empty, it says "Nothing fits <date> <from>–<to> for <guests>." |
| Needs adjusting (<n>) | At least one hard clash, outside the guest range, or past the requested end. Each card's notes say which. |

- **Custom booking** (sv "Egen bokning"), an outline button under the tabs with "Put the booking together line by line". It opens the build step.
- **Title-row action**: **Create package** (its create page; with `template:write`).
- **A suggested package** (from a message) is marked "★ Suggested from the email", preselected, and its tab is the open one.
- **Picking a package** that needs a follow-up opens a dialog, one question at a time ("question 1 of 3"):
  1. **Guests outside the range**: "Lower/Raise the booking to <n> guests", or "Keep <n> guests (lines over capacity are flagged)".
  2. **Runs past the requested end**: "Extend the order to <end>", or "Keep <to> and shorten the lines in review".
  3. **Clashes**: "Move the booking to <start>–<end> (first free time)" (shifts from and to by the same amount; offered when `firstFreeStart` exists), or "Keep the time and prebook (blocked until resolved)".

  **Cancel, pick another package** leaves nothing picked. When done, a summary line shows the package and the answers.
- **Next** is disabled until a package is picked with every question answered.
- **Replacing lines**: lines are never merged. When lines from another pick exist (another package, or a custom booking), Next on a package and Custom booking on a package's lines first ask "Replace the <n> lines?" (Replace, Cancel). The same pick again keeps its lines.
- **No packages at all**: the step says "No packages yet" above Custom booking; Create package stays on the title row.
- The done summary: the package with its answers, or "Custom booking".

## 4 · Build the booking (custom booking only)
- Opened by Custom booking in step 3; starts empty, or with the custom lines built before.
- **Order type**, asked only when the organization has more than one active order type, and the type's required own fields.
- **Calendar snapshot** and **lines table** with **+ Add line** and the line dialog, as in review. Empty, the table is "Nothing added yet" with quick-add buttons for the most used items.
- **Also save these lines as a package**, with a name.
- **Next** is disabled until there is a line ("Add a line to continue"); it checks the type's fields first and stays while one is missing. It opens choices when a line has a required choice, else review. **Back** opens step 3.
- The done summary: "<n> lines".

## Choices (ADR 0089)
- Shown only when the lines (a package's, or a custom booking's) have an item with a **required group** (`minPick` 1 or more), e.g. Afternoon break buffet with "Snack (choose 1)". Otherwise the previous step's Next opens review, and the step is not listed. The description says "Some lines need a choice, such as which snack to serve."
- It opens after step 3's (or the build step's) Next when the lines it asks are new; the same lines again go back to review.
- One card per such line, titled with the line's name:
  - its required groups, with the line dialog's controls (a pick per normal group, a quantity per option in a split group, ADR 0082). Optional groups stay in the line dialog.
  - its needs (counts per list value, e.g. Vegan 2, Nut allergy 1), as in the line dialog.
- The package's default choices (see "Package defaults") are already picked; staff confirm or change them with the customer. A change here changes only this order's draft, never the package.
- Every change goes straight into the draft line. **Next** is always enabled and opens review; **Back** opens step 3, or the build step for a custom booking.
- The done summary: "<n> lines · all chosen" or "<n> lines · <m> choices open".

## Package defaults (ADR 0089)
- A package line can preselect choices for its item's normal groups, at most each group's maximum (the package editor shows one control per normal group; a pick beyond the maximum replaces the oldest). Split groups get no defaults: "<group> is split between guests and is always asked when the order is created."
- Picking the package starts its lines with those choices; `order.createFromTemplate` applies them too.
- A default that no longer fits the item (no longer one of its options, now in a split group, or over the group's maximum) is ignored when the package is used. The package editor names it ("<option> is no longer an option of this item. It is removed when you save.") and saving drops it.

## Review the booking
- The same for a package and a custom booking.
- **Header**: customer, date, guests, "nothing is saved until Create".
- A package's order type fields show here; a custom booking's were asked in the build step.
- **Calendar snapshot**:
  - The requested day, from 08:00–20:00 or wider to cover every line (past midnight marked "+1").
  - One row per item the timed lines use, showing that day's other bookings of it in subtle gray (soft holds lighter and dashed; for a bookable resource its holds, labelled with order and customer, for any other item, such as a buffet, the other orders' lines) and this order's draft lines and add-ons (dashed, red when they clash; an add-on on its own item's row); bars that overlap go on lanes of their own, and a label too long for its bar ends in "…" (full text on hover). Free-text lines share one "Other lines" row, shown only when there are any.
  - It fits the card: a fixed label column, the hours take the rest of the width, no sideways scrolling.
  - Pool and stock shortages are listed under it.
  - The view updates as lines change. **Open calendar** opens the full calendar in a dialog (90% of the viewport) on that day, read-only (no adding, moving or leaving), with this draft's lines over it (dashed look, the clash look where they clash). Clicking a booking opens a run sheet over it with its order, customer, line state, line, resource, period, quantity and hold; fields the member may not read are left out.
- **Lines table**: time, line (name, then a second row with layout, choices, needs, price override and note), quantity ("12 (guests)" or a fixed number), availability (✓, ⚠ or ✕ with the issue text), unit price (in effect: line, price list or item), cost (quantity × unit price less the discount, from the preview; "–" without a price), and a menu with **Edit** and **Remove line** (each with an icon; Remove asks for confirmation first). A line's add-ons (ADR 0088) follow it as indented rows with an "Add-on" badge, each with its own time (the line's unless set), quantity (the line's it follows, or its own), availability, unit price (its own: line override, price list or item; the line's discount does not apply) and cost. On an add-on, **Edit** opens its line's dialog and **Remove** (confirmed) drops only the add-on; removing a line removes its add-ons. A footer row shows the total of the priced lines and add-ons, which is also the order's estimated value.
- **+ Add line** opens the line dialog empty. **Edit** opens it with the line.
- **Title**: optional, at the top of the step, becomes `Order.title`; left empty, one is generated after the create (AI feature `order.title`).
- **Notes on the booking**: a text area, becomes `Order.note`.
- **Blocked lines summary**: "<n> lines clash with other bookings. They are prebooked (soft hold) and stay blocked until you move the time or the other booking is freed."
- **Open questions** (yellow panel, each with its answers). Create shows "Answer <n> questions first" until all are answered.

| Question | Answers |
|---|---|
| The start changed from <a> to <b>. What should happen to the lines? | Move every timed line <±delta> · Keep the line times |
| There are no lines. Create the order as a lead without lines? | Yes, a lead without lines · + Add a line |
| <line> has quantity 0. | Remove the line · Edit line |
| <line>: <group> is not chosen yet. <rule>. (a required group with no pick, ADR 0089) | Decide later · Edit line |
| <line>: <group> has <n> chosen. Choose <rule>. (the item's group pick rule as `order.create` checks it: only for a group with a pick (ADR 0089)) | Edit line |
| <line>: <n> choices (or needs) but only <q> ordered. | Lower to fit · Edit line |
| <line>: <q> needed, only <free> left that day. | Prebook all <q> (source <q−free> more) · Lower to <free> |
| The email doesn't say <field>. The assistant guessed <value>. | Keep <value> · Change it |
| <type> orders need <field>. | (fill the field) · Use another order type |
| The new package needs a name. | (fill it) · Don't save as a package |

- **Assignee** (default: the creating member) and **holds until**, always shown. The order's estimated value is the lines' total, not typed.
- **Create**:
  - The label is **Create order**, or **Create and prebook** when lines clash. While saving it shows "Creating…" and is disabled.
  - It is disabled until the order can be created, and the label says why, in this order: "Answer <n> questions first", "Checking availability…" (the preview is loading), "Fix what is listed above first" (issues no field can show), "Fix the highlighted fields first" (the form's own fields, marked at once).
  - The whole `order.create` input is checked on every change. Issues that name no field of step 4, from that check or from the server (`lines.1.options`), show in a red panel above Create: a line's issue as "<line>: <message>" with **Edit line**, any other as its message. Server issues stay until the lines or the form change. The error toast then says "Could not create the order. See what to fix above Create." instead of pointing at highlighted fields.
  - It runs `order.create` with the lines, the title (when given), the note, `templateId` and `inboundMessageId`, and an `intakeKey`.
  - On `CONFLICT` for a new clash, nothing is created. The page previews again and shows "Not created yet. Since you started, #<ref> booked <resource> <period>. The lines and calendar are updated. Check them and create again."
  - After create, with "save as package" ticked, it runs `orderTemplate.create`. A failure there shows a toast; the order stays. The package keeps the lines but not their add-ons: template lines have no add-ons (ADR 0088), so they are dropped from what is saved.

## The line dialog
- **What**: a search across every active item of every type. Each result shows its type and its availability at the order's start. **+ Free-text line** adds a line with no item. In edit, **Change item** returns to the search.
- **Line**:
  - Name, editable.
  - Date: the order's, shown read-only.
  - From and to: empty means untimed.
  - Quantity: shows the headcount while it follows it ("One per guest: changes if the guest count changes"). Typing a number fixes it ("Fixed at <n>"). **Use the guest count (<n>)** returns to following.
- **Fields by capability** (ADR 0059):

| Capability | Fields |
|---|---|
| `BOOKABLE` | Time, availability for that time |
| `SETUPS` | Layout (capacity shown) |
| `CUSTOMISATIONS` | Choices per group: a pick in a normal group, a quantity per option in a split group (ADR 0082). Each group with a pick must get between its min and max picks (core's rule, a split group counting options above 0); a group with no pick is open, even a required one (ADR 0089: review asks it, the order's line warns); a broken group says "Choose 1", "Choose 1–2", "Choose at least 1" or "Choose at most 2" under it, and Save waits. An edited line shows it at once. The max is a hard limit (ADR 0088, amended): a normal group takes no more picks than its max, and with max 1 a new pick replaces the old one. More is an add-on (below). |
| `PRICED` | Unit price (list price shown as the placeholder), discount |

- **Add-ons** (ADR 0088), under the item's fields: items added with **+ Add an item** (the same item search, or free text with a name). Each added row shows the item and its catalog price, a quantity (empty follows the line's), **Own time (else the line's)** with from and to, and **Remove**. An add-on has the line's type. Saved with the line as `addOns`, created as add-on lines under it.
- **Needs**: counts per value from the organization's lists (Vegan 2, Nut allergy 1), stored as line Requirements.
- **Note** (shown on run sheets).
- **Availability box**: the preview's issues for this line, live. A hard clash says "You can still save; the line is prebooked and shown as blocked."
- **Footer**: **Remove line** (edit only), Cancel, Add line or Save.

## The order page after Create
- Header, status (the entry status), assignee, period, guests, contact and "from package <name>" or "Custom booking".
- The booking notes. "Order created with <n> lines", or "as a lead without lines", plus "<n> lines blocked: resolve before confirming" when lines clash.
- With a message: "<sender>'s email is attached to the order's inbox. Drafted by the assistant from the email, checked and created by you."
- Next actions: Add line, Send quote, Payment link, Hold until.
- A required choice left for later shows as a warning at the top ("Choice not made yet: <line>: a required choice is still open") and as a badge on its line, until it is chosen (`UNCHOSEN_REQUIRED_GROUP`, ADR 0089).

## Core
- `order.previewLines` and `order.create` draft lines take `addOns[]` (`{ itemId?, name?, entityTypeId?, quantity?, unitPriceMinor?, discountPercent?, startsAt?, endsAt?, note? }`); the preview returns them priced with their issues under each line, create writes them as `role = ADD_ON` lines with errors at `lines.<i>.addOns.<j>`: ADR 0088.
- `order.previewLines`, `order.create` (with `lines`, `note`, `templateId`, `inboundMessageId`, `intakeKey`; contact required; starts in the entry status), `order.createFromTemplate` (same path, template start status, contact required): ADR 0081.
- `customer.findSimilar`, `customer.create` with `contact`, `customer.list` with `recent`, `calendar.range` with `itemIds`: ADR 0081.
- `line.chooseOptions` with `options[{ itemId, quantity? }]`, split groups, `OPTION_SPLIT_MISMATCH`: ADR 0082.
- A group with no pick is open in `line.chooseOptions` and `order.create`, even a required one, and gives the line warning `UNCHOSEN_REQUIRED_GROUP`; `orderTemplate.create|update` take `lines[].options` (default choices, reads add `stale`), `order.previewLines` returns each package line's `options`, `order.createFromTemplate` applies them: ADR 0089.
- `InboundMessage` and `InboundEndpoint`; `inboundMessage.list|get|attachToOrder|markRead|markUnread|delete|submit`, feature `inbox` (read, write, delete, submit); EMAIL channel built, WEB_FORM and SMS designed: ADR 0085.
- `orderDraft.fromMessage`, AI feature `order.intakeDraft`: ADR 0084.
- All on web, GraphQL, REST and MCP (ADR 0003).
