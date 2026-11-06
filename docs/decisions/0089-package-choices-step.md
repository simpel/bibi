# 0089 – Choices step in the intake and default choices on packages

- **Date:** 2026-11-02
- **Status:** Accepted
- **Amends:** 0081 (intake steps), 0082 and 0088 (`line.chooseOptions` checks every group)
- **Related:** 0021, 0043, 0051, 0052, 0059, 0003
- **Spec:** `docs/specs/order-intake.md`

## Context
- A package line can have an item with a required customisation group, such as "Snack, choose 1". The intake asked it only inside a line dialog in review, behind an Edit button, so orders were created without it.
- Package lines stored no choices, so a venue that serves the same snack nine times in ten picked it on every order.
- `line.chooseOptions` checked every group whenever anything was chosen, so "decide later" worked only for a whole line.

## Decision
1. A new intake step, Choices, sits between package and review. It follows the other steps' rules.
2. It shows only when a package line has a required group (`minPick >= 1`), with the group controls and the line's needs. Optional groups stay in review. A one-off never has the step.
3. Undecided choices do not block. A required group left open becomes an open question in review with Decide later and Edit line.
4. An open required group is a derived line warning, `UNCHOSEN_REQUIRED_GROUP`, never stored. Choosing an option clears it.
5. `line.chooseOptions` allows a required group to stay empty. `minPick` and `maxPick` apply only to a group with at least one pick.
6. Packages store default choices in `OrderTemplateLineOption`, a foreign key to the option's `Item` (ADR 0056), not to `ItemCustomisationOption.id`, which changes whenever groups are replaced. Split groups get no defaults.
7. Defaults prefill the step when a package is picked. Changing a choice changes only that order's draft. `order.createFromTemplate` applies the defaults the same way.
8. A default that no longer fits is ignored and shown as a warning on the package. Nothing is rewritten in the background.

## Rejected
- Choices in review only. Review is already the busiest step and the choice is easy to miss.
- Block Next until every required group is chosen. The customer often decides later and the booking must still be held.
- Ask every group in the step. Optional groups rarely matter at intake.
- Defaults as option ids. They break on the first edit of the item.
- Defaults as JSON on the template line. Ids in JSON break ADR 0056.
- Refuse an item edit that removes an option a package uses. It would tie the catalog to every package.

## Consequences
- Expand-only migration for `OrderTemplateLineOption`.
- `orderTemplate.create|update` take `lines[].options`, and `order.previewLines` returns each package line's defaults, on every surface.
- Candidate to merge into `docs/specs/order-intake.md`.
