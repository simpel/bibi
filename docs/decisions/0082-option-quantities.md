# 0082 – Customisation options with their own quantity

- **Date:** 2026-11-01
- **Status:** Accepted (approved by the user on 2026-11-01)
- **Amends:** 0059 (customisations: an option line had the parent's quantity, chosen at most once)
- **Related:** 0081 (ticket intake), 0052 (the line is the booking, headcount inheritance), 0021 (needs as counts, Requirements)

## Context
- Today `line.chooseOptions({ lineId, optionItemIds })` makes one option line per chosen option, with the same quantity as its parent line. A group's `minPick` and `maxPick` count distinct options.
- Real orders split a choice across the guests: a dinner for 14 with "Main course, choose 1" is 10 fish and 4 vegetarian. Today that needs two dinner lines, or a note the kitchen has to read.
- Diet and allergy counts (Vegan × 2, Nut allergy × 1) are needs, not choices. They stay Requirements (ADR 0021): counts per list value that are matched against the items' tags and compiled into sheets. This ADR only covers choices that change what is served or charged.

## Decision
1. **A customisation group can be split.** `ItemCustomisationGroup` gets `split` (owned, default false).
   - In a normal group, a chosen option applies to the whole line, as today.
   - In a split group, each chosen option carries a **quantity**: how many of the line's quantity get that option.
   - `minPick` and `maxPick` count distinct options in both kinds. In a split group they mean "between 1 and 2 different main courses", not a per-guest pick.
2. **Option lines get an owned quantity.** An option line's `quantity` is null in a normal group, so its effective quantity is the parent's. In a split group it is set to a number of 1 or more. The database allows a quantity on an option line only when the option's group is split; core checks this.
3. **`line.chooseOptions` takes `options: [{ itemId, quantity? }]`** instead of `optionItemIds`, on every surface, in the same change. `quantity` is required for an option in a split group and refused for one in a normal group (`VALIDATION`). The choice is replaced as a set, as today. An option still occurs at most once per line.
4. **The split total is not enforced, it is warned.** In a split group the quantities should add up to the parent's effective quantity, but the headcount changes after choices are made. A mismatch (more or fewer than the parent) is a derived line warning, `OPTION_SPLIT_MISMATCH`, carrying the group id, the sum and the expected total. It is never stored and never refused. The intake page (ADR 0081) turns "more than the quantity" into an open question.
5. **Pricing follows the option's quantity.**
   - `INCLUDED` never counts.
   - `EXTRA` counts the option line's effective quantity at the option's price.
   - `REPLACES` counts the option line at its price. The parent counts only the quantity no `REPLACES` option covers: its effective quantity minus the sum of its `REPLACES` option quantities, at least 0. In a normal group nothing changes, because a `REPLACES` option covers the whole line, as today.
6. **Quotes and invoices snapshot option lines as they are**, each with its own quantity (`OrderLine` already has a quantity). The parent's snapshotted quantity is the remainder from decision 5 when a split `REPLACES` option exists.
7. **Sheets list option lines with their quantities** (10 Fish, 4 Vegetarian under Dinner). The option's item tags are matched against the ticket's Requirements as any line's are.
8. **Moving and archiving are unchanged**: option lines move and are archived with their parent. A split option line keeps its quantity when the parent's quantity changes. The warning in decision 4 shows the mismatch.

## Consequences
- Migration:
  - `ItemCustomisationGroup.split`;
  - a check that only option lines of split groups have a quantity (core);
  - `chooseOptions` input renamed on GraphQL, REST and MCP;
  - quote derivation and `effectiveQuantity` for parents with split `REPLACES` options;
  - a new warning kind;
  - sheet rendering.
- Existing data: every group starts as not split, so every existing option line stays as it is.
- The intake line dialog (ADR 0081) shows a quantity stepper per option in split groups and a pick per group otherwise.
- The demo seed marks the three-course dinner's main course as split and books 10 / 4 on one ticket.

## Alternatives rejected
- **Two lines for one dinner** (one per main course). Rejected: the run sheet and the quote show two dinners, and the headcount no longer belongs to one line.
- **Use Requirements for main courses.** Rejected: a requirement is a need counted against tags, not a priced choice of what is served. Choices change the price and the order line, needs do not.
- **Enforce that split quantities add up exactly.** Rejected: the headcount moves until the guaranteed number is locked, and a refusal would block every headcount change. A warning shows the gap where it matters.
- **Per-guest picks (a choice per person).** Rejected: no personal data about guests (ADR 0021), and counts are what the kitchen needs.
