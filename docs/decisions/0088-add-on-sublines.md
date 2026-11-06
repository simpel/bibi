# 0088 – Add-ons: extra lines under any line

- **Date:** 2026-11-02
- **Status:** Accepted; decision 5 amended 2026-11-02
- **Amends:** 0059 (a sub-line was a part or an option, told apart by `priceEffect`), 0082
- **Related:** 0052 (the line is the booking), 0051, 0053, 0043, 0044, 0081, 0003

## Context
- A customer who wants all three snacks in a "choose 1" group got a refusal, and staff added unrelated free-standing lines.
- The same need exists without groups: a projector on a room, wine with a dinner. It is sold together with a line at its own price.
- A sub-line was inferred to be an option when `priceEffect` was set, else a part. A third kind cannot be told apart this way.

## Decision
1. An add-on is a `Line` with a `parentLineId` and a new owned marker `role = ADD_ON`. It can be of any item or free text with a price, and is booked, held, priced and snapshotted like any line.
2. Every sub-line says what it is. `LineRole { PART, OPTION, ADD_ON }` is set once at insert. Checks: `role` is null exactly when `parentLineId` is null, and `priceEffect` is allowed only for `OPTION`. Code reads `role`, not `priceEffect`.
3. Parts never count in totals, options follow their group's price effect, add-ons always count at their own price.
4. One level only. An add-on's parent is a top-level line, and an add-on follows its parent's alternative group.
5. A group's `maxPick` is always a hard limit. Anything more is an add-on that staff add explicitly. `line.chooseOptions` still refuses more and points to add-ons.
6. Price: line override, then price list, then item list price. Quantity is its own, else the parent's. VAT is its own. The parent's discount does not apply.
7. Quotes and invoices snapshot an add-on as its own `OrderLine` carrying `role`.
8. An add-on without a time takes its parent's period, holds its item like any line, and is checked for clashes like any line.
9. Add-ons have their own item type state and follow status moves.
10. A parent's moves and archiving cascade to its add-ons. An add-on never changes parent.
11. No new command. `line.create` takes an optional `parentLineId`. `order.create` and `order.previewLines` take `addOns[]` on draft lines.

## Rejected
- A separate `LineAddOn` table. It would need its own hold trigger, states, pricing and snapshot, and the line would stop being the only record of what is sold.
- Infer the kind from `priceEffect`, with an add-on as an `EXTRA` option. An add-on has no group, so the snapshot would lie.
- Core silently turns picks above the max into add-ons. The price changes unseen and depends on input order.
- Apply the parent's discount to add-ons. A second, hidden inheritance path.
- Add-ons at any depth. No case needs it.
- A `line.addAddOn` command. It would repeat every field of `line.create`.

## Consequences
- Expand-only migration: `LineRole`, `Line.role` and `OrderLine.role`, backfilled from `priceEffect` and `parentLineId`.
- Every inference from `priceEffect` or `parentLineId` in quote derivation, quantity and sheets moves to `role`.
- Quotes, invoices, the payment page and sheets show add-ons nested under the parent.
