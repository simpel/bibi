# Demo data

Specification for `pnpm --filter @bibi/core seed:demo` (ADR 0025). Two fictional organizations set up completely differently with the same code, to show the configurable domain (ADR 0021).

- **Lindholmen Experience Center**: conferences, exhibition and restaurant. Uses everything: vocabularies with allergens, sheets to the kitchen, bundles, item states and a phase grid.
- **Vingaleden Archipelago Tours**: boat tours in the Gothenburg archipelago. No food, no allergens, other phases and other requirements.

All dates are relative to the day of the run: `D` = today, `D+3` = in three days. Times are local time in the zone `effectiveTimeZone` resolves (ADR 0064): ticket-level times (`desired*`, `holdsUntil`) in the organization's zone, lines in their venue's.

**Time zones (ADR 0064):** both organizations have `Europe/Stockholm` on their profile. Vingaleden's venue Saltholmen has its own zone, `Europe/Oslo` (the same offset all year, so its times read the same); Lindholmen's venue inherits (`timeZone` null).

## Checks after seeding (CI)

The script ends with checks that make CI fail if the demo does not show what it should:

1. The number of rows per entity and organization matches the tables below.
2. Vingaleden has no vocabulary called "Allergens", and none of its sheets include food.
3. Lindholmen's kitchen order for ticket L5 is **blocked**: anaphylaxis to crustaceans against a mandatory dish.
4. Lindholmen's kitchen order for ticket L3 is **not** blocked: the nut allergy has an alternative in the customisation group.
5. Tickets F2 and F3 hold the same room and time with soft holds. Both lines are `Prebooked`, F2 was held before F3 (its newest `LineStateChange` is older; no queue).
6. Ticket F6's `holdsUntil` has passed and its line is still `Prebooked` until `ticket.expireHolds` runs.
7. Every write has a row in `AuditLog` with actor `SYSTEM`, except each user's own profile and working hours, saved as that user (ADR 0061).
8. Lindholmen's phase grid drives phase moves: moving L11 to Confirmed books its room line and skips its overridden lunch line, and moving L12 to Confirmed is refused because L4 has a hard hold on the same room, and nothing changes.
9. Every projection matches what is rebuilt from owned data (ADR 0051): `reconcile-checks.ts` registers a `rebuild` query and a `compare` function per projection (`reconcile.ts`), and `checks.ts` runs them all and fails with the first differing rows. Today: line holds in `Occupancy` (`HOLD`, `SETUP` and `TEARDOWN` with `lineId`, written only by the database trigger `sync_line_occupancy`, ADR 0053, 0059) against the lines that have not ended (same item, kind and period; a soft or hard hold also its setup and teardown buffers of the same kind, and each allocated unit for its demand's windows with the line's kind and the allocation's id, ADR 0059), the `Record` supertable rows against the seven tables that extend them (same base, type, status and fields, ADR 0056), and every ticket's `phaseId` and every line's `stateId` against its newest `TicketPhaseChange` and `LineStateChange` (`history-reconcile.ts`, ADR 0054; a ticket without history, or a line with a state but no history, differs). Vitest calls the same `reconcileProjections`.
10. Lindholmen's alternative groups (ADR 0052, `alternative-checks.ts`): L13's "Workshop room" (Hönö or Styrsö) is open after its quote was sent, and both options are soft holds; L14's "Planning room" was chosen when its quote was accepted (`quote.accept` with `chosenLineIds`), so Planning in Hönö is the group's `chosenLineId` and still holds (Booked by the grid), and Planning in Styrsö is `Released` and holds nothing. `checkDemoHolds` expects the Styrsö option released too.
11. Phase history is owned data (ADR 0054), made by the same operations as the moves: every ticket's history starts without a from phase, by `TEMPLATE` for the tickets made from a predefined ticket and by `MANUAL` otherwise; a ticket in a quote-event phase got there by `QUOTE_EVENT` (or started there from a template); every board card's time in phase is its newest change (`pipeline-checks.ts`, `board-checks.ts`). Lindholmen's "Final count locked" requires an accepted quote: moving the first open ticket without one there is refused with that blocker and changes nothing (`fact-guard-checks.ts`).
12. Setup and teardown buffers (ADR 0059, `buffer-checks.ts`): every line's effective setup and teardown minutes and their sources follow line → item → type, and the setup is the larger of that and its setup's changeover time, never the sum. Lindholmen's Conference room type has 15/15, Vinga (auditorium) overrides the teardown with 30, L13's Workshop in Hönö (a soft hold) has its own setup of 30, Meal has 30/15 and Equipment 10/10. The room lines of the predefined tickets (L7, L10) use the Boardroom setup, whose changeover (20) is longer than the type's 15, so their setup is 20 with source `SETUP`. The soft and hard holds on rooms then have `SETUP` and `TEARDOWN` rows of their own kind (check 9).

13. Pools (ADR 0059, `pool-checks.ts`): a type flagged `pool` in the data files is a pool of interchangeable units. Lindholmen's Wireless microphone type has ten units (Wireless microphone 01 to 10, bookable, setup and teardown 5). `item.freeUnits` for the type in a window far from every booking lists all ten in name order, the prepick is the first, and a second call answers the same.
14. Bundles (ADR 0059, `bundle-checks.ts`): every bundle a ticket expands is one bundle line with one part line per part of the bundle item that is not a customisation option (`Line.parentLineId`). Its sent quote freezes the bundle line with one VAT row per rate (`vatRows`, at least two: Lindholmen's Conference day mixes the room at 25 % with coffee and lunch at 12 %) that sum exactly to its total and VAT, and the part lines as order lines with `parentLineId` that do not count (`inTotal` false).
15. Demands and allocations (ADR 0059, `allocation-checks.ts`): the Projector and the Mobile sound system each need one technician (the Technician pool of two, a Person type) for their SETUP and TEARDOWN windows. Every hard-held line whose item has demands has each mandatory slot filled (`lineAllocation.list`), and each allocated unit is no longer free (`item.freeUnits`) in the windows its demand holds it for, so an overlapping setup gets the other technician. Lindholmen must show at least one: L4's Sound for the conference line (Mobile sound system, D+5 09–13, Booked) holds Technician 1 for its 10-minute setup and teardown, `HARD` like its line. L11's untimed Projector hire line has an unfilled slot and holds nothing. That the allocation holds match exactly is the `line-holds` reconciliation (check 9).
16. Time zones (ADR 0064, `time-zone-checks.ts`): each organization's profile has its zone, Saltholmen stores `Europe/Oslo` and Lindholmen's venue stores `null`, and `effectiveTimeZone` resolves each venue to its own zone, else the organization's.

The checks that run today:
- **Part 1 (roles):** the members per organization, and that every user has their fixed role (ADR 0034) according to the tables.
- **Permission overrides (ADR 0050):** `checkDemoPermissions` (`permission-checks.ts`) asserts that every documented override is stored for its member (via `permission.get`). Lindholmen has two: Maria Holm (`manager`) has `payment:read` denied, so she handles bookings but does not see money; Peter Sjoberg (`member`) has `item:write` and `item:write` allowed, so he reads everything and also keeps the catalogue up to date. Seeded with `permission.update` in `seed-roles.ts` from the `overrides` of the user in `data/lindholmen/lindholmen.ts`.
- **Part 2 (configuration):**
  - The number of rows per organization matches for venue, vocabularies, vocabulary values, setups, responsibilities, types, fields, items and capacities (point 1 for what exists).
  - Each responsibility covers the item types and has the default followers of the table below, in order (its join rows, ADR 0056).
  - Archiving a field that records have values for is refused with `CONFLICT`, and the refusal lists the blocking records in `issues` (`checkDemoRecords`, `record-checks.ts`, ADR 0056). Nothing changes.
  - `LINK` values are `RecordLink` rows (ADR 0056, `checkDemoLinks`, `link-checks.ts`, run from `config-checks.ts`): as many rows as the data files give (Lindholmen: L1 Host Mats Olsson, L3 Host Eva Sund; Vingaleden none), each pointing at an active record, no LINK field key in any `Record.fields`, and archiving a linked contact is refused with `CONFLICT` and leaves it active.
  - Vingaleden has no vocabulary "Allergens" (the first half of point 2).
  - Lindholmen's imported vocabulary "Allergens" has 14 values.
  - The number of item parts (`ItemPart`) per organization matches the data files.
- **Part 3 (catalog):** the whole catalog of both organizations is seeded via `item.create` as SYSTEM, parts after the items they contain, and Nordkust management team via `item.saveAsBundle` right after its customer. The checks compare with the data files per organization: the number of items (Lindholmen 76, Vingaleden 9), customer-specific bundles (Lindholmen 1), item parts (`ItemPart`, choice options included) and customisation groups (`ItemCustomisationGroup`). The test also verifies that the Three-course dinner has the groups Starter, Main course and Dessert over 8 parts, and that Nordkust management team belongs to Nordkust Logistik. Every customisation group in the tables is "choose 1" (`minPick` = `maxPick` = 1).
- **Part 2 (configuration), item states:** every item type with states in the data files gets them from a template (ADR 0044) through `itemState.create`, initial state first; the type's default state "Active" is archived and the template's Released state becomes the type's expiry state (`entityType.update` `expiryStateId`). Templates: bookable (Prebooked `SOFT` `expires`, Booked `HARD` `inSheets`, Released), food (Estimated, Ordered, Locked `inSheets`, Released) and other (Planned, Confirmed `inSheets`, Released; on a `BOOKABLE` type Planned holds `SOFT` and Confirmed `HARD`). Lindholmen: Conference room and Equipment bookable, Dish, Drink and Meal food, Tour and Guide other; Package keeps "Active". Vingaleden: Boat and Skipper bookable, Tour and Add-on other. Lindholmen also has the line type Line (base `LINE`).
- **Part 4 (customers), started:** the number of customers and contact persons per organization matches the data files, and Nordkust Logistik has its price list with a general discount of 15 %. Ticket phases and the phase grid follow when those operations exist.
- **Part 5 (tickets), started:** the number of tickets per organization matches the data files, each with its customer, type, desired period, headcount, own fields, main assignee and 0–2 followers by name (ADR 0034; `checkDemoAssignments` compares the counts). Each ticket is created through `ticket.create` in the entry phase and then moved to its phase. A phase with a quote event (Lindholmen's Quote sent and Confirmed) is reached through the ticket's quote (ADR 0052): the ticket gets an untimed line of the item named in its `quote` (`line.create`, counting the headcount) unless one of its lines already has that item, then `quote.create` (valid 30 days, a live view of the priced lines) and `quote.send`, which freezes every priced line as an order line, and for Confirmed also `quote.accept`. L4's Conference lunch line is changed to 14 after its quote was accepted (`changeAfterQuote`), so L4 differs from its accepted quote; any other phase (all of Vingaleden's, and Completed, Lost) through `ticket.changePhase` (`checkDemoTickets` compares the number of tickets per phase and checks the minimum configuration: one entry and one terminal phase). The phases are the organization's own (see Ticket phases and the pipeline part below): open tickets after the deal are Confirmed, L1, L2 and V1 Completed, L6 ("Budget") Lost, V2 ("Weather") Called off – weather, V3 Weather OK and V4 Weather hold. Requirements and the other lines follow. Responsibility assignments are derived (ADR 0055): no row exists for them except the explicit choices of `choices` in the data files, made through `assignment.assign` and `assignment.unfollow` (L11 only, in `seed-ticket-choices.ts`); `checkDemoChoices` (`choice-checks.ts`) asserts that exactly those rows are stored and that on every seeded ticket with lines each applicable responsibility's derived assignee and followers equal its defaults except those choices.
- **Part 5, predefined tickets (ADR 0043):** each organization has its predefined tickets from `data/<org>/templates.ts` (Lindholmen 2, Vingaleden 1), created with `ticketTemplate.create` after the pipeline. L7 (Small meeting) and L10 (Afternoon break) are created with `ticket.createFromTemplate`, not by hand, and start in the template's phase, Confirmed. `checkDemoTemplates` asserts the template and line counts against the data files and that each ticket made from a template has one line per template line, each in the state the phase grid gives its item type for the template's phase (the room Booked, the meal Ordered).
- **Part 5, holds (checks 5 and 6):** the leads F2, F3 and F6 stay before the quote (New) and each gets one room line through `line.create`, which starts in Prebooked, a soft hold. F2 (Kickoff) and F3 (Product launch) hold Vinga (auditorium) on D+45 09–17 with `holdsUntil` D+5; F6 (Team day) holds Hönö on D+12 with `holdsUntil` D−1. `checkDemoHolds` verifies that every seeded line of a lead without an override starts in its initial state, that F2 and F3 are two overlapping lines in a `SOFT` state with F2's `heldAt` before F3's, then runs `ticket.expireHolds` once: F6's line is Released and F2's and F3's lines are still Prebooked. The holds themselves are not checked by hand: the `line-holds` reconciliation (check 9) runs right after the expiry and compares every stored hold with what the lines say. The seed never writes `Occupancy` for a line; the holds appear by trigger when `line.create`, `line.changeState` and the phase moves change the lines. `reset.ts` deletes the lines before the items, and their holds go with them (`ON DELETE CASCADE`), so the triggers need no special handling; the allocations go before the lines (their chain links cut first, ADR 0059) and the demands with their tags before the items. After seeding, F6's line is therefore already Released.
- **Part 5, pipeline and phase grid (checks 8 and 10):** after the item types and states and before any ticket, `seed-pipeline.ts` gives each organization its own pipeline from `data/<org>/pipeline.ts`: the phases are created with `ticketPhase.create` and their transitions set with `ticketPhase.setTransitions` (the organization is provisioned with `pipeline: "none"`, so the default phases of ADR 0043 are not created), then the grid is set with `phaseGrid.setCell`. Lindholmen uses the conference-estate set (the phase table above). Its grid: New, Site visit and Quote sent set Conference room to Prebooked and Tour and Guide to Planned; Confirmed sets Conference room and Equipment to Booked, Dish and Meal to Ordered and Tour and Guide to Confirmed. Cells left out keep the state (food and equipment before the deal, Drink throughout). Vingaleden uses its own tour-company set (below): Request and Weather hold set Boat and Skipper to Prebooked and Tour to Planned, Confirmed and Weather OK set them to Booked and Confirmed; Add-on has no cells. `checkDemoPipeline` (check 10) asserts per organization the number of phases, transitions, item states and grid cells against the data files, one entry and one terminal phase, and exactly one initial state per item type. The same templates ship for every organization: `ticketPhase.importTemplate` and `phaseGrid.importTemplate` with `default` and `conference-estate`, and `provisionOrganization` applies `default`. The grid template matches by state name, so it fills the cells of every type that has a state of that name. The `event` flags of the phase table come from the conference-estate template (`QUOTE_SENT` on Quote sent, `QUOTE_ACCEPTED` on Confirmed); Vingaleden's phases have none, so both cases are covered. `checkDemoQuoteEvents` (`quote-event-checks.ts`) asserts that every order line has a `lineId` of a line on its quote's ticket, that exactly the accepted quotes of tickets with `changeAfterQuote` (L4) differ from their tickets, each flagging only that line's quantity, that each ticket made through a quote sits in its event phase with one quote that is `SENT` (Quote sent) or `ACCEPTED` with `acceptedAt` and method `MANUAL` (Confirmed, accepted by SYSTEM so `acceptedBy` is empty), that tickets made from a predefined ticket (L7, L10) have no quote, and that an organization without event phases has no quotes. New lines start in their entry phase's cell. L4 gets a Styrsö line (D+5 09–13) and a Mobile sound system line (Sound for the conference, same time), which the grid moves to Booked (hard holds) when the seed confirms L4; the sound system's line gets a technician by prepick when it is added (check 15). L11 (Göta, D+6, Lead) has a Styrsö line (Board meeting, with its own unit price of 800 kr, ADR 0052), a Conference lunch line overridden to Locked with `line.changeState` and an untimed Projector hire line (quantity 1, no time, so it holds nothing and is not on the calendar). The other seeded lines have no quantity of their own and count the ticket's headcount (guaranteed if set, else estimated). L12 (Hisingen, D+5 10–12, Lead) soft-holds Styrsö inside L4's booking. `checkDemoGrid` then moves L11 to Confirmed (by accepting its quote; a phase with an event cannot be entered with `ticket.changePhase`) (its Styrsö line becomes Booked, the overridden lunch stays Locked) and tries to move L12 to Confirmed (it makes and sends a quote first, which moves L12 to Quote sent), which must be refused with `CONFLICT` naming the L12 line and leave L12 and its line unchanged. After seeding, L11 is therefore already Confirmed. `checkDemoArchive` (`archive-checks.ts`, run before `checkDemoGrid` so L11 is still in Quote sent) previews removing a populated phase that no predefined ticket starts in (Quote sent, with a transition to a phase without an event or a required reason as the target, since no ticket can be moved into an event phase and the preview gives no reason) and a non-initial item state that lines use (with the type's initial state as the target), through `ticketPhase.archivePreview` and `itemState.archivePreview`: every ticket or line moves and nothing blocks. The preview rolls back, so the seeded data is unchanged.
- **Pipeline board (check 9):** `checkDemoBoard` runs `pipeline.board` and asserts one column per seeded phase, every seeded ticket on exactly one card in a known column (the terminal tickets of the retention window sit in the Closed lane). Cards also carry the held and booked line counts. No new data: the existing tickets already cover every phase.
- **Part 5, money (ADR 0057):** a ticket's `money` in the data files gives it a deposit request and a payment. Lindholmen's L3 gets a SENT deposit request "Advance at confirmation" of 5 000 kr (`deposit.create`, `deposit.send`), and L5 a card payment of 10 000 kr against its accepted quote (`payment.create` with `quoteId`), marked SUCCEEDED by Stripe's paid signal through `payment.applySignal`, as the webhook would. The seed activates each organization's payout account first (`paymentAccount.startOnboarding` and `paymentAccount.sync`) and never calls Stripe: `withDemoPayments` (`demo-payments.ts`) installs a Connect gateway that reports every account ACTIVE and the memory payment provider for the run. `checkDemoPayments` (`payment-checks.ts`) asserts that every ticket with an accepted quote has the balance `payment.balance` derives, the quote's total minus its SUCCEEDED payments counted straight from the rows, that there are as many SENT deposit requests as the data files give, and that the SUCCEEDED payments add up to the data files' `paidKr`. Vingaleden has no money.
- **All parts:** point 7.
- **Without a pipeline (`seed:demo -- --skip-pipeline`, ADR 0044):** the same organizations with roles, configuration, catalog and customers, but no ticket phases, no grid and no tickets, and every item type keeps its one default state "Active" (the state templates are not applied). The organizations are provisioned with setup status `PENDING`, so their admins land in the welcome setup (ADR 0061). `checkDemoSetupNeed` asserts the setup status (`PENDING` here, `COMPLETED` on a normal run), that `ticketPhase.list` is empty, no grid cells and one state per item type; on a normal run it asserts the opposite. The customer and ticket counts expect no tickets. `guard.ts` is unaffected: production is refused either way.

## Exceptions and sign-in

- The organization, the users and the memberships are Better Auth tables. They are written directly (`seed/demo/users.ts`), the same way sign-up and `addMember` do. Everything else goes through `execute` as `SYSTEM`, except each user's profile and working hours (`seed-profiles.ts`, ADR 0061), saved through `profile.update` and `workingHours.set` as that user because `self:*` operations refuse SYSTEM. The organization profile gets the venue's address. Admins get `admin` directly, the others get their role via `member.assignRole`. Right after, `provisionOrganization` gives each organization its defaults (a minimal set of ticket phases, ADR 0043) as SYSTEM, the same way Better Auth's `afterCreateOrganization` hook does for a real sign-up.
- The users' email is `firstname.lastname@<slug>.bibi.test`, e.g. `anna.berg@lindholmen-demo.bibi.test`. Sign in with a magic link or a one-time code; the email ends up in Mailpit.
- **Mega admin (development):** when `seed:demo` runs for the demo organizations, it also creates `mega.admin@admin.bibi.test` ("Mega Admin"): a superadmin (`user.role = "superadmin"`, ADR 0015) and the `admin` of every demo organization, written directly like the other users (`seed-mega-admin.ts`). It is created once and kept across reseeds (same id), only its memberships are rebuilt. It is not part of any organization's member count (the checks run before it is added), and tests that pass their own `orgs` do not create it. `checkDemoMegaAdmin` (`mega-admin-checks.ts`, run by `run-mega-admin.ts`) asserts the superadmin role and the `admin` membership. The dev user switcher lists it as a top-level entry above the organizations.
- **AI models (development):** the same platform step gives every AI feature that has no model yet its demo model (`data`-style list in `ai-models.ts`: Claude Sonnet for `assistant.chat`, a 1536-dimension embedding model for `search.embedding`), written as `AiSetting` rows updated by the mega admin (`seed-ai-models.ts`), so the assistant and search work right after `seed:demo`. A model a superadmin already chose in `/admin/ai-models` is never overwritten. `checkDemoAiModels` (`ai-model-checks.ts`) asserts every feature in `AI_FEATURES` has one. The ids are Vercel AI Gateway ids and can be changed in `/admin/ai-models`; the embedding feature needs a reindex when its model changes.
- Access uses the fixed roles as presets (ADR 0034, 0050): `member` reads everything except audit, assistant and API keys and changes nothing, `manager` also works in bookings and selling (customers, tickets, lines, quotes, payments, sheets), `admin` can do everything, including configuration and members. Admins add per-member overrides (Maria Holm and Peter Sjoberg in Lindholmen show both directions). What each person answers for (sales, coordinator, kitchen, caretaker) comes with responsibilities, not roles.
- Part 2 seeds the configuration and the bookable spaces: Lindholmen's 10 conference rooms and Vingaleden's 3 boats, each in the organization's venue. Part 3 seeds the rest of the catalog (dishes, drinks, meals, guides, tours, equipment, packages, skippers, trips and add-ons) in the same venue. A part has no setup of its own, so "Knippla in the Cabaret setup" and "The View, Banquet" are seeded as the room only; the setup is chosen on the line. Tour group sizes ("max 25 people") are not seeded, since Tour has no `SETUPS`. The requirement types under "Other types" come in part 5, because they point to vocabularies via `requirement.*`.

---

# Lindholmen Experience Center

Slug `lindholmen-demo`. Venue: Lindholmspiren 1, 417 56 Göteborg.

## Configuration

### Roles
Fixed roles (ADR 0034). The function in parentheses is what the person answers for; see Responsibilities below.

| User | Role |
|---|---|
| Anna Berg | admin |
| Erik Lund (sales) | manager |
| Sara Nilsson (sales) | manager |
| Johan Ek (coordinator) | admin |
| Maria Holm (coordinator) | manager |
| Ali Karimi (kitchen) | manager |
| Peter Sjoberg (caretaker) | member |
| Lena Strand (finance) | manager |

### Responsibilities
Seeded in part 2 via `responsibility.create` as SYSTEM, after the item types. Followers are optional.

| Responsibility | Covers (item types) | Default assignee | Default followers |
|---|---|---|---|
| Sales | Bundle | Erik Lund | Sara Nilsson |
| Coordinator | Conference room, Equipment, Tour, Guide | Johan Ek | Maria Holm |
| Head of kitchen | Dish, Drink, Meal | Ali Karimi | – |

### Vocabularies
| Vocabulary | Values |
|---|---|
| Allergens | Imported template "EU 14 allergens": Gluten, Crustaceans, Eggs, Fish, Peanuts, Soy, Milk, Tree nuts, Celery, Mustard, Sesame, Sulphur dioxide/sulphites, Lupin, Molluscs |
| Diet | Vegetarian, Vegan, Halal, Pork-free |
| Severity | Intolerance, Allergy, Anaphylaxis |
| Accessibility | Wheelchair, Hearing loop, Guide dog |
| View | River, Courtyard, None |
| Dresscode | Casual, Blazer, Dark suit |

### Setups
Theatre (15 min), Classroom (30), U-shape (30), Boardroom (20), Cabaret (40), Banquet (60), Reception (15).

### Item types
Setup and teardown minutes are the type's defaults (ADR 0059); an item or a line overrides them.

| Type | Capabilities | Own fields |
|---|---|---|
| Conference room | `BOOKABLE`, `SETUPS`, `PRICED`; setup 15, teardown 15 min | Floor (number), Area m² (number), Ceiling height m (number), Daylight (yes/no), View (choice: View) |
| Dish | – | Allergens (multi-choice: Allergens), Diet (multi-choice: Diet) |
| Drink | `PRICED` | Allergens (multi-choice), Alcoholic (yes/no) |
| Meal | `PRICED`, `BUNDLE`, `CUSTOMISATIONS`; setup 30, teardown 15 min | Service style (choice: Buffet, Plated, Finger food) |
| Tour | `PRICED`, `BUNDLE`, `CUSTOMISATIONS`, `BOOKABLE` | Language (multi-choice: Swedish, English, German) |
| Guide | `BOOKABLE` | Language (multi-choice) |
| Equipment | `BOOKABLE`, `PRICED`; setup 10, teardown 10 min | Inventory number (text) |
| Wireless microphone | `BOOKABLE`; setup 5, teardown 5 min; a pool (check 13) | Inventory number (text) |
| Technician | `BOOKABLE`; Person (staffing); a pool (checks 13 and 15) | – |
| Bundle | `PRICED`, `BUNDLE`, `CUSTOMISATIONS` | Minimum quantity (number) |

### Other types
| Base entity | Types and fields |
|---|---|
| Customer | Company (Org no., Framework agreement yes/no) · Public sector (Org no., Peppol-ID, Requires case number yes/no) · Association (Org no.) |
| Contact | Contact person (Role: choice Orderer, Invoice recipient, Organizer) |
| Ticket | Conference (Purpose, Host: link to a Contact person) · Event (Dresscode: choice Dresscode, Speaker/entertainment) · Tour (School class yes/no) |
| Requirement | Dietary requirement (vocabulary Allergens or Diet, field Severity) · Accessibility (vocabulary Accessibility) |

### Ticket phases (ADR 0043)
| Phase | Flags |
|---|---|
| New | `entry` |
| Site visit | – |
| Quote sent | `event` `QUOTE_SENT` |
| Confirmed | `event` `QUOTE_ACCEPTED`, `requiresAssignee` |
| Final count locked | `requiresAssignee`, `requiresAcceptedQuote` |
| Completed | `terminal`, `requiresAssignee`, `invoiceable` |
| Lost | `terminal`, `requiresReason` |
| Cancelled | `terminal`, `requiresReason` |

### Item states and the phase grid (ADR 0044)
| Item type | States (initial first) |
|---|---|
| Conference room, Equipment (`BOOKABLE`) | Prebooked (`SOFT`, `expires`), Booked (`HARD`), Released |
| Dish, Drink, Meal | Estimated, Ordered, Locked (`inSheets`), Released |
| Tour, Guide | Planned, Confirmed, Released |

| Phase | Rooms and equipment | Food | Tours and guides |
|---|---|---|---|
| New, Site visit, Quote sent | Prebooked | Estimated | Planned |
| Confirmed | Booked | Ordered | Confirmed |
| Final count locked | keep | Locked | keep |
| Completed, Lost, Cancelled | Released | Released | Released |

### Ticket templates
| Template | Type | Phase | Lines (offset from the ticket start, length) |
|---|---|---|---|
| Small meeting | Conference | Confirmed | Asperö (Boardroom) 0 min, 2 hours; Coffee and tea 0 min, 2 hours, no quantity (the headcount) |
| Afternoon break | Conference | Confirmed | Donsö (Boardroom) 0 min, 3 hours; Afternoon break 60 min, 30 min, no quantity (the headcount) |

L7 and L10 are created with `ticket.createFromTemplate` from these (see Tickets). Both start in Confirmed, so the grid books the room (Booked) and orders the meal (Ordered); Coffee and tea is a drink and keeps its initial state.

### Sheets
| Sheet | Item types | Requirements | To (responsibility, ADR 0034) |
|---|---|---|---|
| Kitchen order | Dish, Drink, Meal | Allergens, Diet | Kitchen |
| Setup order | Conference room, Equipment | Accessibility | Caretaker |
| Guide brief | Tour, Guide | Accessibility | Coordinator |

## Catalog

### Conference rooms (10)
Price per hour excl. VAT. Capacity per setup. Vinga (auditorium) has its own teardown of 30 minutes (the type's is 15).

| Room | Floor | m² | Daylight | View | Capacity | SEK/h |
|---|---|---|---|---|---|---|
| Vinga (auditorium) | 1 | 260 | yes | River | Theatre 220, Classroom 120, Banquet 160, Reception 250 | 4,500 |
| Hönö | 2 | 90 | yes | River | Theatre 70, Classroom 40, U-shape 28, Cabaret 48, Banquet 56 | 1,900 |
| Öckerö | 2 | 70 | yes | Courtyard | Theatre 50, Classroom 30, U-shape 22, Cabaret 36 | 1,500 |
| Styrsö | 3 | 45 | yes | River | Boardroom 16, U-shape 14 | 950 |
| Vrångö | 3 | 45 | yes | Courtyard | Boardroom 14, U-shape 12 | 900 |
| Donsö | 3 | 32 | yes | River | Boardroom 10 | 700 |
| Brännö | 3 | 32 | yes | Courtyard | Boardroom 10 | 650 |
| Asperö | 3 | 20 | no | None | Boardroom 6 | 450 |
| Knippla (workshop) | 1 | 120 | yes | Courtyard | Classroom 50, Cabaret 60, Reception 100 | 2,200 |
| The View (roof terrace) | 5 | 150 | yes | River | Banquet 90, Reception 150 | 3,800 |

### Dishes (24)
| Dish | Allergens | Diet |
|---|---|---|
| Sourdough bread with butter | Gluten, Milk | Vegetarian |
| Yoghurt with granola | Milk, Gluten, Tree nuts | Vegetarian |
| Scrambled eggs | Eggs, Milk | Vegetarian |
| Fresh fruit | – | Vegan |
| Cinnamon bun | Gluten, Milk, Eggs | Vegetarian |
| Carrot cake | Gluten, Eggs, Milk, Tree nuts | Vegetarian |
| Oat ball | Gluten | Vegan |
| Oven-baked cod loin, browned butter | Fish, Milk | Pork-free |
| Veal roast with red wine sauce | Milk, Celery, Sulphur dioxide/sulphites | Pork-free |
| Mushroom risotto | Milk | Vegetarian |
| Lentil stew with coconut rice | Celery | Vegan |
| Green salad and bread | Gluten | Vegan |
| Skagen shrimp salad on rye bread | Crustaceans, Eggs, Gluten, Mustard | – |
| Beetroot carpaccio with chèvre | Milk, Tree nuts | Vegetarian |
| Venison fillet, celeriac purée | Milk, Celery, Sulphur dioxide/sulphites | Pork-free |
| Pan-fried pike-perch, mussel sauce | Fish, Molluscs, Milk, Sulphur dioxide/sulphites | Pork-free |
| Celeriac steak, mustard vinaigrette | Celery, Mustard | Vegan |
| Chocolate fondant with hazelnut | Tree nuts, Eggs, Milk, Gluten | Vegetarian |
| Cloudberry parfait | Eggs, Milk | Vegetarian |
| Lemon sorbet | – | Vegan |
| Toast Skagen | Crustaceans, Gluten, Eggs | – |
| Charcuterie and cheese | Milk, Mustard, Sulphur dioxide/sulphites | – |
| Hummus with vegetable sticks | Sesame | Vegan |
| Spiced nuts | Tree nuts, Peanuts | Vegan |

### Drinks (6)
| Drink | Price | Allergens | Alcohol |
|---|---|---|---|
| Coffee and tea | SEK 35/pp | – | no |
| Mineral water | SEK 25/each | – | no |
| Sparkling welcome drink | SEK 95/pp | Sulphur dioxide/sulphites | yes |
| Alcohol-free bubbly | SEK 65/pp | – | no |
| Lager from Göteborg | SEK 85/each | Gluten | yes |
| Wine package (2 glasses) | SEK 225/pp | Sulphur dioxide/sulphites | yes |

### Meals (6)
Parts without a customisation group are mandatory. Meals are sold at 12 % VAT (`vatRatePercent` on the item); everything else uses the venue's default of 25 %.

| Meal | Price/pp | Parts |
|---|---|---|
| Conference breakfast | 125 | Sourdough bread, Yoghurt with granola, Scrambled eggs, Fresh fruit, Coffee and tea |
| Morning break | 65 | Coffee and tea + **choose 1:** Cinnamon bun, Oat ball, Fresh fruit |
| Afternoon break | 65 | Coffee and tea + **choose 1:** Carrot cake, Oat ball, Fresh fruit |
| Conference lunch | 245 | Green salad and bread, Mineral water + **main course, choose 1:** Cod loin, Veal roast, Mushroom risotto, Lentil stew |
| Three-course dinner | 595 | **Starter, choose 1:** Skagen shrimp salad, Beetroot carpaccio · **Main course, choose 1:** Venison fillet, Pike-perch, Celeriac steak · **Dessert, choose 1:** Chocolate fondant, Cloudberry parfait, Lemon sorbet |
| Reception buffet | 245 | Toast Skagen, Charcuterie and cheese, Hummus with vegetable sticks, Spiced nuts (all mandatory) |

### Guides and tours
- Guides (`BOOKABLE`): Emma Lind (Swedish, English), Oskar Ahl (Swedish, German), Nora Falk (Swedish, English).
- Exhibition tour: 60 min, max 25 people, SEK 1,450 per group. **Choose 1 guide.**
- Evening tour: 90 min, max 25 people, SEK 2,200 per group. **Choose 1 guide.** Shows that something bookable can sit in a customisation group.
- Design workshop: 120 min in Knippla, SEK 395/pp. Contains the room Knippla in the Cabaret setup.

### Equipment
Projector (SEK 450), Mobile sound system (SEK 900), Extra whiteboard (SEK 150), Hearing loop (SEK 0).

Wireless microphone: a pool of ten interchangeable units (Wireless microphone 01 to 10, inventory numbers LEC-MIC-001 to LEC-MIC-010), a type of its own (check 13).

The Projector and the Mobile sound system each need one technician for their setup and teardown (`itemDemand.create` right after the item, check 15). Technician: a pool of two people (Technician 1 and 2), the Person type Technician, seeded after the equipment.

### Bundles (5 in the catalog + 1 customer-specific)
| Bundle | Price/pp | Contents (offset from start) |
|---|---|---|
| Half-day conference | 545 | **Room, choose 1:** Hönö, Öckerö, Styrsö, Vrångö (+0:00, 4 h) · Morning break (+1:30) · Conference lunch (+3:30) |
| Full-day conference | 795 | **Room, choose 1:** Hönö, Öckerö, Styrsö, Vrångö (+0:00, 8 h) · Morning break (+1:30) · Conference lunch (+3:30) · Afternoon break (+6:00) |
| Day + evening | 1,016 | Sparkling welcome drink (+0:00) · **Room, choose 1:** Hönö, Öckerö (+0:15, 7 h) · Morning break (+1:30) · Conference lunch (+3:00) · Evening tour (+8:00) · Reception buffet (+9:30) |
| Evening event | 1,290 | Evening tour (+0:00) · Sparkling welcome drink (+1:30) · The View, Banquet (+1:30, 5 h) · Three-course dinner (+2:00) · Wine package (+2:00) |
| Conference day | 695 | Vrångö (+0:00, 8 h) · Morning break (+1:30, 30 min) · Conference lunch (+3:30, 1 h); no customisations, expanded on L15 (ADR 0059) |
| Nordkust management team *(customer: Nordkust Logistik)* | 595 | Styrsö, Boardroom (+0:00, 4 h) · Morning break (+0:30) · Conference lunch (+3:00) |

## Customers

Contact persons have the type Contact person; the role in parentheses is its Role field. Contacts without a role in the table are Orderer, except Eva Sund (Organizer), Ekonomienheten (Invoice recipient) and Ulla Berg (Organizer).

| Customer | Type | Contacts | Price list |
|---|---|---|---|
| Nordkust Logistik AB | Company (framework agreement) | Karin Wallin (orderer), Fakturor Nordkust (invoice recipient) | Nordkust framework agreement: −15% on everything |
| Hisingen Energi AB | Company | Mats Olsson | – |
| Västra Sjukvårdsregionen | Public sector (Peppol, case number) | Eva Sund, Ekonomienheten | – |
| Kvarnby Design AB | Company | Linnea Kvist | – |
| Göta Advokatbyrå KB | Company | Henrik Strand | – |
| Älvstrand Tech AB | Company | Amir Haddad | – |
| Göteborgs Seglarsällskap | Association | Ulla Berg | – |

## Tickets

The main assignee (A) and followers (F) are given by first name (ADR 0034): the coordinator answers for a ticket and the salesperson follows it.

### Leads, holds and quotes
| # | Customer | What | Phase | Shows |
|---|---|---|---|---|
| F1 | Göteborgs Seglarsällskap | Anniversary party, 150 people, D+60 | New, no assignee yet | the inbox |
| F2 | Hisingen Energi | Kickoff, 100 people, D+45 in Vinga | Site visit, A Erik. Vinga D+45 09–17 `Prebooked`, `holdsUntil` D+5 | a soft hold |
| F3 | Kvarnby Design | Product launch, 80 people, D+45 in Vinga | Site visit, A Sara. Vinga on the same time `Prebooked` (held later than F2) | overlapping soft holds, "held since" |
| F4 | Västra Sjukvårdsregionen | Workshop, 30 people, D+40 | Quote sent. Quote v1 (40 people) replaced by **v2 (30 people) `SENT`**, valid until D+10 | quote versions |
| F5 | Göta Advokatbyrå | Evening event, 40 people, D+20 | Lost, reason "Price". Quote v1 `DECLINED` | loss reason |
| F6 | Älvstrand Tech | Team day, 20 people, D+12 | Site visit. `holdsUntil` D−1, room line `Prebooked` until `ticket.expireHolds` runs | expiry |

### Tickets after the deal
| # | Customer · type | When | Count | Contents | Phase | A / F | Shows |
|---|---|---|---|---|---|---|---|
| L1 | Hisingen Energi · Conference | D−21 | 40 | Full-day conference in Hönö (U-shape) | Completed | Johan / Erik | history |
| L2 | Kvarnby Design · Event | D−10 | 80 | Evening event | Completed | Maria / Sara | history |
| L3 | Västra Sjukvårdsregionen · Conference | D+3 | 60 | Day + evening in Hönö (Theatre) + Projector. In the evening the Reception buffet is replaced by the Three-course dinner. | Final count locked, a sent deposit request of 5 000 kr (ADR 0057) | Johan / Erik, Maria | **Requirements:** Gluten × 4 (Allergy), Tree nuts × 1 (Anaphylaxis), Vegetarian × 8, Wheelchair × 1. The nuts give "may contain" without blocking. See note below. |
| L4 | Göta Advokatbyrå · Conference | D+5 09–13 | 12 | Half-day conference, Styrsö (Boardroom), Booked by the grid, + Conference lunch (14 after the quote was accepted) | Confirmed | Maria / Sara | simple ticket, the hard hold that blocks L12, a ticket that differs from its accepted quote |
| L5 | Älvstrand Tech · Event | D+14 | 120 | Vinga (Reception) + Reception buffet + Wine package | Confirmed, 10 000 kr of the accepted quote paid by card (ADR 0057) | Maria / Erik | **Blocked kitchen order:** Crustaceans × 2 (Anaphylaxis) against Toast Skagen, which is mandatory |
| L6 | Hisingen Energi · Conference | D+30 | 25 | Full-day conference | Cancelled, reason "Budget" | Erik / – | cancellation |
| L7 | Göta Advokatbyrå · Conference | D+1 10–12 | 4 | Asperö (Boardroom) + Coffee and tea | Confirmed, payment link sent | Sara / – | ticket from the Small meeting template, payment pending |
| L10 | Hisingen Energi · Conference | D+4 13–16 | 6 | Donsö (Boardroom) + Afternoon break | Confirmed, on invoice | Johan / Erik | ticket from the Afternoon break template, invoice |
| L8 | Göteborgs Seglarsällskap · Tour | D+2 14:00 | 22 | Exhibition tour with guide Oskar (German) | Confirmed | Johan / Sara | Tour type, bookable guide |
| L9 | Kvarnby Design · Conference | D+8 | 18 | Design workshop + Conference lunch | Confirmed | Maria / Sara | activity that contains a room |
| L11 | Göta Advokatbyrå · Conference | D+6 09–13 | 10 | Styrsö (Boardroom, own price 800 kr) + Conference lunch, the lunch line overridden to Locked, + Projector hire without a time | Quote sent (check 8 moves it to Confirmed) | Maria / – | a line state override that survives a phase move; the only explicit responsibility choices: Head of kitchen answers as Johan instead of the default Ali, and Maria has left Coordinator's default followers (ADR 0055) |
| L12 | Hisingen Energi · Conference | D+5 10–12 | 8 | Styrsö, a soft hold inside L4's booking | Lead | Erik / – | a phase move blocked by a hard hold (check 8, e2e) |
| L13 | Kvarnby Design · Conference | D+20 09–12 | 14 | Workshop in Hönö **or** Styrsö (alternative group "Workshop room", both `Prebooked`) + Conference lunch | Quote sent | Maria / – | alternatives: the quote shows both rooms and counts the cheaper as a "from" price (check 10) |
| L14 | Älvstrand Tech · Conference | D+25 09–12 | 16 | Planning in Hönö **or** Styrsö (alternative group "Planning room") + Conference lunch; the customer picked Hönö on accept | Confirmed | Johan / – | a chosen alternative: Hönö Booked by the grid, Styrsö released (check 10) |
| L15 | Hisingen Energi · Conference | D+18 09–17 | 24 | Conference day expanded with `line.expandBundle`: the bundle line (695 kr per person, `Active`) and part lines Vrångö (`Prebooked`), Morning break and Conference lunch (`Estimated`) | Quote sent | Johan / Erik | a bundle line and part lines; the quote charges the bundle line only, with VAT per rate (25 % and 12 %) that sums exactly (check 14) |

**Note on L3:** the nut allergy hits Chocolate fondant, which has the alternatives Cloudberry parfait and Lemon sorbet. The result is "may contain" and no blocking (check 4). The replacement is made on the ticket's copy of the package, so the catalog package is not changed (snapshot, ADR 0021). L3 thus also shows that a package can be adapted for a single occasion.

---

# Vingaleden Archipelago Tours

Slug `vingaleden-demo`. Venue: Saltholmen, 426 76 Västra Frölunda. No food and no allergens. The same code, another world.

## Configuration

### Roles
Fixed roles (ADR 0034).

| User | Role |
|---|---|
| Per Vinga | admin |
| Stina Holm (tour desk) | manager |
| Kalle Ek (skipper) | member |
| Jonna Sand (skipper) | member |

### Responsibilities
| Responsibility | Covers (item types) | Default assignee | Default followers |
|---|---|---|---|
| Tour desk | Tour, Add-on | Stina Holm | – |
| Skipper | Boat, Skipper | Kalle Ek | Jonna Sand |

### Vocabularies
| Vocabulary | Values |
|---|---|
| Harbor | Saltholmen, Lilla Bommen, Styrsö Bratten, Vrångö |
| Accessibility | Wheelchair, Walker, Stroller |
| Life jacket | Child under 15 kg, Child 15–40 kg |
| Certification | Ship officer class VIII, Boat license |

### Setups
Seated (10 min), Standing (5 min), Deck reception (20 min).

### Item types
| Type | Capabilities | Own fields |
|---|---|---|
| Boat | `BOOKABLE`, `SETUPS`, `PRICED` | Registration number (text), Toilet on board (yes/no), Max knots (number) |
| Skipper | `BOOKABLE` | Certification (choice: Certification) |
| Tour | `PRICED`, `BUNDLE`, `CUSTOMISATIONS` | Departure harbor (choice: Harbor), Distance nm (number) |
| Add-on | `PRICED` | – |

### Other types, phases, item states and sheets
- Customer: Company (Org no.) · Private (no fields).
- Contact: Contact person (no fields).
- Ticket: Charter · Round trip.
- Requirement: Accessibility (vocabulary Accessibility) · Life jacket (vocabulary Life jacket).
- Ticket phases (no `event` flags: its tickets move by `ticket.changePhase`): Request (`entry`), Weather hold, Confirmed, Weather OK, Completed (`terminal`, `invoiceable`), Called off – weather (`terminal`, `requiresReason`), Cancelled (`terminal`, `requiresReason`).
- Item states: Boat and Skipper (`BOOKABLE`): Prebooked (`SOFT`), Booked (`HARD`), Released. Tour and Add-on: Planned, Confirmed, Released. The grid sets Prebooked and Planned in Request and Weather hold, Booked and Confirmed from Confirmed on, and Released in the terminal phases.
- Sheets: **Pier order** to Skipper with the item types Boat, Skipper and Add-on and the requirements Accessibility and Life jacket.
- Ticket templates: **Lighthouse tour with blankets** (Round trip, starts in Request): the Lighthouse tour to Vinga for 90 minutes and Blankets and rain gear, both without a quantity, so they count the headcount (ADR 0052). No ticket is made from it; it shows a template in an organization without conference rooms. Line type: Line (base `LINE`).

## Catalog
| Item | Type | Details | Price |
|---|---|---|---|
| M/S Kajan | Boat | Seated 48, Standing 80, Deck reception 60, toilet | SEK 3,200/h |
| M/S Tern | Boat | Seated 24, Standing 40, toilet | SEK 2,100/h |
| RIB Snabben | Boat | Seated 12, 40 knots | SEK 2,600/h |
| Kalle Ek | Skipper | Ship officer class VIII | – |
| Jonna Sand | Skipper | Boat license | – |
| Sunset tour | Tour | Saltholmen, 18 nm. **Boat, choose 1:** Kajan, Tern · **Skipper, choose 1** · 2.5 h | SEK 495/pp |
| Lighthouse tour to Vinga | Tour | Saltholmen, 14 nm. RIB Snabben + skipper Jonna · 1.5 h | SEK 650/pp |
| Blankets and rain gear | Add-on | – | SEK 40/pp |
| Coffee on board | Add-on | Shows that food can exist without allergen vocabularies | SEK 35/pp |

## Customers and tickets
Customers: Hisingen Energi AB (Company, the same name as at Lindholmen but a completely separate row in another organization; contact Mats Olsson), Familjen Rask (Private; contact Johan Rask), Kvarnby Design AB (Company; contact Linnea Kvist).

Per Vinga is the main assignee of V1–V3 and Stina Holm follows them; V4 is assigned to Stina Holm.

| # | Customer · type | When | Count | Contents | Phase | Shows |
|---|---|---|---|---|---|---|
| V1 | Hisingen Energi · Charter | D−7 | 40 | Sunset tour with Kajan, Standing | Completed | history |
| V2 | Kvarnby Design · Charter | D−2 | 20 | Sunset tour with Tern | Called off – weather | an organization-defined terminal phase |
| V3 | Familjen Rask · Round trip | D+2 | 9 | Lighthouse tour to Vinga + Blankets | Weather OK | **Requirements:** Wheelchair × 1, Life jacket child under 15 kg × 2 → Pier order |
| V4 | Hisingen Energi · Charter | D+10 | 60 | Sunset tour with Kajan, Deck reception + Coffee on board | Weather hold | an organization-defined phase with soft holds on the boat |

---

## After the capability rename (ADR 0059, #390)

The migration `rename_capabilities_bundle_customisations` renames `behaviours` to `capabilities`, `COMPOSABLE` to `BUNDLE`, `CHOICES` to `CUSTOMISATIONS`, `ItemComponent` to `ItemPart` and `ItemChoiceGroup` to `ItemCustomisationGroup` in place. Dev and worktree databases need `pnpm db:migrate` and then `seed:demo` again (it resets the demo organizations), so the type named "Package" becomes "Bundle" and stored JSON (audit rows, embeddings, conversations) of the demo data no longer shows the old names.

## Structure in the code

- `packages/core/src/seed/demo/data/` has one folder per organization (`lindholmen/`, `vingaleden/`). The files are pure data, split so that no file goes over 150 lines, e.g. `lindholmen.ts` (roles and users), `config.ts`, `types.ts`, `rooms.ts`, `dishes.ts`, `drinks.ts`, `meals.ts`, `activities.ts` (guides, tours, equipment), `bundles.ts`, `customers.ts` and `tickets.ts`; Vingaleden's skippers, trips and add-ons are in `tours.ts`. `pipeline.ts` holds the phases and the phase grid.
- `seed-demo.ts` runs the parts in order via `execute` with core operations: `seed-roles.ts`, `seed-config.ts`, `seed-responsibilities.ts`, `seed-items.ts`, `seed-customers.ts`, `seed-pipeline.ts` (phases, then the grid in `seed-grid.ts`) and `seed-tickets.ts` (lines and their overrides in `seed-lines.ts`). Items with `parts` or `customisations` come after the items they contain (`seed-item-input.ts` resolves them); a customisation group's options become parts too. Contact persons, the price list and customer-specific packages are created right after their customer.
  - The data refers to rows by name: vocabulary, setup, type, field and value, e.g. `View: "River"`. A `LINK` field names its target type (`linkType`) and its values name a record of that type (`Host: "Eva Sund"`, resolved by `resolveLinks` in `seed-fields.ts`).
  - The names are resolved to ids and field keys at run time (`demo-refs.ts`).
- `seed-templates.ts` creates the predefined tickets from `data/<org>/templates.ts` through `ticketTemplate.create` (items, setups, ticket type and start phase by name), after the pipeline and before the tickets. A ticket with `template` in `tickets.ts` is created through `ticket.createFromTemplate` (`seed-ticket-from-template.ts`) and is not moved afterwards.
- `reconcile.ts` (the harness) and `reconcile-checks.ts` (the registered projection checks, with `record-reconciliation.ts` and `history-reconcile.ts`) run from `checks.ts`.
- Every record is created through core operations, which write its `Record` row first (`createRecord`, ADR 0056); `reset.ts` deletes the phase and line-state history (ADR 0054) before the lines and tickets, and the `RecordLink` rows first and the `Record` rows after the seven tables that extend them.
- `checks.ts`, `template-checks.ts`, `config-checks.ts`, `ticket-checks.ts`, `assignment-checks.ts`, `hold-checks.ts`, `pipeline-checks.ts`, `board-checks.ts`, `fact-guard-checks.ts` and `grid-checks.ts` contain the checks above.
- The seed is extended at the same pace as the parts in ADR 0025. A part that lacks operations is skipped with a clear log, so the demo can always be run.
