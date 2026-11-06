# 0082 – Customisation options with their own quantity

- **Date:** 2026-11-01
- **Status:** Accepted
- **Amends:** 0059 (an option line had the parent's quantity and was chosen at most once)
- **Related:** 0081 (order intake), 0052 (the line is the booking), 0021 (needs as counts)

## Context
- An option line had the same quantity as its parent, and `minPick`/`maxPick` counted distinct options.
- Real orders split a choice across guests: a dinner for 14 with "Main course, choose 1" is 10 fish and 4 vegetarian. That needed two dinner lines or a note.
- Diet and allergy counts are needs, not choices. They stay Requirements (ADR 0021). This ADR covers only choices that change what is served or charged.

## Decision
1. A customisation group can be split (`ItemCustomisationGroup.split`, default false). In a split group each chosen option carries a quantity. `minPick` and `maxPick` still count distinct options.
2. An option line's quantity is null in a normal group (it inherits the parent's) and a number of 1 or more in a split group. Core checks this.
3. `line.chooseOptions` takes `options: [{ itemId, quantity? }]` on every surface. Quantity is required in a split group and refused in a normal one.
4. The split total is warned, not enforced. A mismatch with the parent's quantity is a derived warning, `OPTION_SPLIT_MISMATCH`, never stored or refused, because headcount moves until it is locked.
5. Pricing follows the option's quantity. `INCLUDED` never counts, `EXTRA` counts the option line, and `REPLACES` counts the option line while the parent counts only the remainder (at least 0).
6. Quotes and invoices snapshot option lines with their own quantity.
7. Sheets list option lines with their quantities, matched against Requirements like any line.
8. Option lines move and archive with their parent and keep their quantity when the parent's changes.

## Rejected
- Two lines for one dinner. The run sheet and quote show two dinners and the headcount belongs to no one line.
- Requirements for main courses. A requirement is a need counted against tags, not a priced choice.
- Enforce that split quantities add up. It would block every headcount change.
- Per-guest picks. No personal data about guests (ADR 0021).

## Consequences
- Existing groups start as not split, so existing data is unchanged.
- `chooseOptions` input changes on GraphQL, REST and MCP.
- Quote derivation changes for parents with split `REPLACES` options.
