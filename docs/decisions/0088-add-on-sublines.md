# 0088 – Add-ons: extra lines under any line

- **Date:** 2026-11-02
- **Status:** Accepted (approved by the user on 2026-11-02); decision 5 amended on 2026-11-02 (below)
- **Amends:** 0059 (a sub-line was a part or an option line, told apart by `priceEffect`), 0082 (picks above a group's `maxPick` were refused)
- **Related:** 0052 (the line is the booking, snapshots), 0051 (single source of truth), 0053 (holds are a projection), 0043 and 0044 (states per status), 0081 (order intake), 0003 (parity), 0021 (configurable items)

## Context
- The demo item "Afternoon break" has a customisation group "Snack": choose exactly 1 of Carrot cake, Oat ball and Fresh fruit. A customer who wants all three gets a refusal from `line.chooseOptions` ("Snack: choose 1 of its options"). Staff have to add two free-standing lines, which the run sheet and the quote show as unrelated to the break.
- The same need shows up without any group: a projector on a room, wine with a dinner, an extra coffee round on a meeting. It is something sold together with a line, at its own price.
- Today a line has at most two kinds of sub-line, both linked by `Line.parentLineId` (ADR 0059):
  - a **part line**, made by `line.expandBundle`, which never counts in the totals;
  - an **option line**, made by `line.chooseOptions`, which counts as its snapshotted `priceEffect` says.
- The kind is inferred: `priceEffect` set means option, else part. That inference is repeated in quote derivation (`bundle-lines.ts`, `price-effects.ts`), in effective quantity and in sheets (`sheet/item-rows.ts`). A third kind cannot be told apart this way.

## Decision
1. **An add-on is a line under another line.** It is a `Line` with `parentLineId` set and a new owned marker `Line.role = ADD_ON`. It can be of **any item** (or free text with a price), not only an option of the parent's groups. It is booked, held, priced and snapshotted like any line, because it is one (ADR 0052).
2. **Every sub-line says what it is.** New enum `LineRole { PART, OPTION, ADD_ON }`, column `Line.role` (owned, set once at insert, never changed). Database checks:
   - `role` is null exactly when `parentLineId` is null;
   - `priceEffect` is allowed only when `role = OPTION` (replaces `Line_priceEffect_check`);
   - the "option once per line" unique index filters on `role = 'OPTION'`.

   Code reads `role` instead of inferring from `priceEffect`.
3. **How the three differ.**

   | | Part | Option | Add-on |
   |---|---|---|---|
   | Made by | `line.expandBundle` | `line.chooseOptions` | `line.create` with `parentLineId` |
   | Item | a part of the bundle | an option of the parent's groups | any item |
   | Price | none in the total; the bundle's VAT is split across parts | its group's price effect | its own effective price, always in the total |
   | Limit | the bundle's parts | the group's `minPick`/`maxPick` | none |
   | Same item twice | allowed | no | allowed |

4. **One level.** The parent of an add-on is a top-level line (`role` null): an ordinary line, a bundle line or a line with options. Part, option and add-on lines cannot have add-ons. An add-on cannot be in an `AlternativeGroup` itself; it follows its parent's (left out with an unchosen alternative, as options are). Core checks both (`VALIDATION`).
5. **Amended 2026-11-02 (the user's decision): a group's `maxPick` is always a hard limit.** The choice controls never take more than the max (with max 1 a new pick replaces the old one), `allowExtras` is dropped, and anything more is an add-on staff add with "Add add-on" / "+ Add an item". `line.chooseOptions` still refuses more than the max and points to add-ons. Why: on a "choose 1" main course, ticking every dish read as a broken rule, and for food the real answer is a split group (ADR 0082), not extras. The original text follows.

   ~~**Picks above a group's max become add-ons, chosen by staff, not converted by core.** A group gets an owned flag `ItemCustomisationGroup.allowExtras` (default true); with it off, no pick beyond the max is offered and the max stays a hard limit (one main course per guest). `line.chooseOptions` keeps the group rule: `minPick` still applies and more than `maxPick` is still refused, with a message that points to add-ons. In the line dialog, a pick beyond the max turns into an add-on row right away, shown with its price ("Oat ball, extra, 35 kr"). Seeing the price in the dialog is the confirmation; staff remove the row to undo. The included picks (up to the max) stay option lines with the group's price effect. Whether a group's item shows as an extra pick is derived from the add-on's item; no group id is stored, since groups get new ids each time they are replaced (ADR 0082).~~
6. **Price of an add-on** (the user's decision): unit price line override → the customer's price list → the item's list price, for extra picks too (a group sets no extra price of its own); quantity is the add-on's own, else the parent's effective quantity (source `PARENT_LINE`, as option lines). VAT is the add-on's own (line → item → venue). **The parent's discount does not apply**: the add-on's discount is its own override, else the price list's general discount, as for any line. One inheritance chain per value (ADR 0051); staff set a discount on the add-on when they mean it.
7. **Totals and snapshots.** An add-on always counts (`inTotal` true), unless its parent is an unchosen alternative. It does not weigh in a bundle's VAT split and is not covered by a `REPLACES` option. `quote.send` and invoicing snapshot it as one `OrderLine` with `parentLineId` (ADR 0052, 0057). `OrderLine` gets `role` (snapshot) so documents can indent it without reading the live line.
8. **Time and holds.** An add-on created without a time takes its parent's period (copied at insert, owned after, ADR 0059 decision 3); an untimed parent gives an untimed add-on. Staff can set its own period (a projector only for the morning). A bookable add-on holds its item through `sync_line_occupancy` like any line, and its clashes, pool shortage and setup capacity are checked and previewed like any line's. No trigger changes.
9. **States.** An add-on has its own item type's state, taken from the grid at insert and following status moves like any line (ADR 0043, 0044). A hard state that clashes is refused as for any line.
10. **When the parent changes.**
    - Moves: timed add-ons move by the same delta in the same operation (`moveParts`).
    - Quantity: an add-on without its own quantity follows; one with its own keeps it.
    - Item: allowed when the line has only add-ons below it. Add-ons do not come from the parent's item, so they stay; parts and options still lock the item.
    - Archived or removed: its add-ons are archived with it (`archiveParts`), and in the intake draft they are removed with it.
    - An add-on is never moved to another parent; remove it and add it again.
11. **Operations and parity (ADR 0003).** No new command for writing:
    - `line.create` takes an optional `parentLineId`. With it the line is an add-on: the order must be the parent's, the line type defaults to the parent's (so it lands on the parent's sheets) and staff may choose another (a projector on a room goes to the AV sheet), time defaults as in decision 8. Permission `program:write`, as today.
    - `line.update` and `line.archive` work on add-ons unchanged; `parentLineId` and `role` are not updatable.
    - `line.chooseOptions` keeps its input; only the refusal text changes.
    - `order.create` draft lines (ADR 0081) get `addOns[]`: `{ itemId?, name?, quantity?, unitPriceMinor?, discountPercent?, startsAt?, endsAt?, note? }`, written in the same transaction; errors at `lines.<i>.addOns.<j>`.
    - `order.previewLines` takes the same `addOns` and returns them priced, with their issues, under each line.
    - Reads: line DTOs (GraphQL, REST, MCP) carry `role`; `OrderLine` carries `role`. Approval labels for `line.create` name the parent when set.
12. **Where add-ons show.** Nested under the parent with their own unit price and cost:
    - the intake review table, counted in the total;
    - the order page's program;
    - quotes, invoices and the payment page, as indented rows under the parent line;
    - sheets such as the kitchen order: an add-on row carries `parentKey` = the parent's row when the parent is on the sheet, else it stands alone named with its parent. Add-on items' tags are matched against the order's Requirements as any line's are.

## Data classes (ADR 0051)
| Data | Class |
|---|---|
| `Line.role`, an add-on's `parentLineId`, times, quantity and price overrides | owned |
| Effective quantity, price, discount and VAT of an add-on; "extra pick" in a group | derived |
| Holds of a bookable add-on | projection (existing trigger) |
| `OrderLine.role` and the add-on's row on a sent quote or invoice | snapshot |

## Consequences
- Migration (expand only, no column changes meaning): `LineRole`, `Line.role`, `OrderLine.role` and `ItemCustomisationGroup.allowExtras` (default true), backfilled in the same migration (`priceEffect` set → `OPTION`, else a set `parentLineId` → `PART`; order lines from their line), then the checks and the rewritten partial index. No contract step.
- Every `priceEffect !== null` or `parentLineId && !priceEffect` test in core and web moves to `role`: quote derivation (`applyBundles`, `applyPriceEffects`), `effectiveQuantity`, sheet rows, `chooseOptions`' option lookup, `checkBundleItem`.
- The line dialog lists add-ons below the groups: extra picks from a group plus "Add an item" with item search. The client pick rule (`group-pick-rule.ts`) stops raising an open question for picks above the max; they are add-ons instead.
- Quote, invoice and payment page templates render indented rows; their totals do not change shape.
- `docs/domain-model.md` and `docs/artifacts/domain-model.html` describe add-ons and `role`.
- Demo seed: one order's Afternoon break with Carrot cake as the pick and Oat ball and Fresh fruit as add-ons; a projector add-on for the morning on a meeting room line; a sent quote showing both. `docs/demo-seed.md` and the seed checks follow.

### Slices
1. `LineRole`, backfill, checks; core reads `role` everywhere. No behaviour change.
2. Core add-ons: `line.create` with `parentLineId`, the parent rules (decisions 4, 10), pricing and quote derivation, `OrderLine.role`, adapters and parity tests.
3. Intake: `addOns` on `order.create` and `order.previewLines`; line dialog extra picks and "Add an item"; nested rows and total in review.
4. Order page program, quote, invoice and payment page rendering, sheets; demo seed and docs.

## Settled with the user (2026-11-02)
- ~~A group can forbid extras (`allowExtras`, default on), decision 5.~~ Amended: the max is always a hard limit, `allowExtras` is dropped (migration `drop_allow_extras`).
- An extra pick costs the option item's own price; a group has no extra price of its own, decision 6.
- An add-on's line type defaults to its parent's and can be changed, decision 11.

## Alternatives rejected
- **A separate `LineAddOn` table.** Rejected: an add-on is booked, held, priced, put in states and snapshotted exactly like a line. A second table would need its own hold trigger, state history, price derivation and order-line snapshot, and the line would stop being the only record of what is sold (ADR 0052).
- **Keep inferring the kind from `priceEffect`, e.g. an add-on as an option line with `EXTRA`.** Rejected: `priceEffect` is a snapshot of a group option's effect, and an add-on has no group. Reusing it would make the snapshot lie, and part lines would still be "a parent and no price effect" by inference.
- **Core turns picks above the max into add-ons silently.** Rejected: the price changes without staff or the assistant seeing it, and which pick is the extra one would depend on input order. The pick is explicit in the dialog and in the API.
- **Apply the parent's discount to its add-ons.** Rejected: a second inheritance path for discount (line → parent line → price list) that staff cannot see on the add-on. A discount set on a dinner is about the dinner.
- **Add-ons at any depth.** Rejected: no case needs it, and nesting would complicate moving, archiving, sheets and documents.
- **A new `line.addAddOn` command.** Rejected: it would repeat every field of `line.create` and its validation; one optional field keeps parity and approval in one place.
