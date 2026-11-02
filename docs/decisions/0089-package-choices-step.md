# 0089 – Choices step in the intake and default choices on packages

- **Date:** 2026-11-02
- **Status:** Accepted (approved by the user on 2026-11-02)
- **Amends:** 0081 (intake steps: who, when, package or one-off, review), 0082 and 0088 (`line.chooseOptions` checks every group, so a required group can never be left open while another is chosen)
- **Related:** 0021 (needs as counts), 0043 (ticket templates), 0051 (single source of truth), 0052 (the line is the booking), 0059 (customisations, line warnings), 0003 (parity)

## Context
- A package line can have an item with a required customisation group. The demo's "Afternoon break buffet" has "Snack (choose 1)": Carrot cake, Oat ball or Fresh fruit.
- Today the intake goes from the package straight to review. The snack is only asked in the review's line dialog, behind **Edit** on one row of the lines table, and nothing points to it. Staff create the ticket without the snack and the kitchen finds out later.
- Package lines store no choices (`TicketTemplateLine` has item, setup, times and quantity), so a venue that serves carrot cake nine times out of ten still picks it on every ticket.
- `checkChoice` (`features/line/option-groups.ts`) checks every group of the item whenever anything is chosen. A line cannot have its snack chosen and its drink left for later, so "decide later" only works for the whole line.

## Decision
1. **A new intake step, Choices, between package and review.** Steps become: 1 who, 2 when and how many, 3 package or one-off, **4 choices**, 5 review. It follows the steps' rules from ADR 0081 (own URL `/new/ticket/choices`, Next and Back, a collapsed summary with Change, kept in the local draft).
2. **The step shows only when it has something to ask.** It lists the package's lines whose item has at least one **required group** (`minPick ≥ 1`). For each such line it shows:
   - its required groups, with the line dialog's controls: a pick per normal group, a quantity per option in a split group (ADR 0082), never more than a group's max (ADR 0088, amended);
   - the line's needs (counts per list value, e.g. Vegan 2, Nut allergy 1), stored as line Requirements as in the line dialog.

   Optional groups (`minPick 0`) are not asked here; they stay in the review's line dialog. A package with no such line skips the step: Next on step 3 opens review, and the step is not listed. A one-off never has the step, because its lines are built in review.
3. **Undecided choices do not block.** Next is always enabled. A required group left open becomes an open question in review: "<line>: <group>, choose <rule>" with **Decide later** and **Edit line**. **Decide later** answers it, and the ticket is created with the group open.
4. **An open required group is a line warning after create.** New derived warning kind `UNCHOSEN_REQUIRED_GROUP` on line reads (ADR 0059), carrying the group id and name: the line's item has an active group with `minPick ≥ 1` and the line has no option line of that group. It is never stored. The ticket page shows it on the line ("Snack not chosen yet") and in the ticket's issue alerts. Choosing an option through `line.chooseOptions` clears it.
5. **`line.chooseOptions` allows a required group to stay empty.** `checkChoice` applies a group's `minPick` and `maxPick` only to a group with at least one pick; a group with no picks is open and gives the warning in decision 4. Every other rule stays (options of the item only, quantities in split groups, more than the max refused or offered as add-ons). The same rule holds for `ticket.create` draft lines and the line dialog's group check (`group-pick-rule.ts`).
6. **Packages store default choices.** New table `TicketTemplateLineOption` (owned): template line, option item (`itemId`, a foreign key to `Item`, ADR 0056) and position. It is replaced as a set with the template's lines by `ticketTemplate.create|update`, which take `lines[].options: [{ itemId }]`.
   - Core checks each default is an option of the line's item and that a group gets no more than its `maxPick` (`VALIDATION` at `lines.<i>.options`). Required groups may be left without a default.
   - The default refers to the option's item, not to `ItemCustomisationOption.id`, because groups and options get new ids each time an item's groups are replaced (ADR 0082).
   - **Split groups get no defaults.** A split group's quantities depend on the headcount, so they are always asked in the step.
7. **Defaults are used, never copied ahead of time.** When the intake picks a package, its lines start with the defaults as their choices, and the step opens prefilled. A line whose required groups are all covered by defaults still shows in the step, so staff confirm the choice with the customer. Changing a choice in the step changes only this ticket's draft, never the package. `ticket.createFromTemplate` (every surface) applies the defaults the same way, as `line.chooseOptions` would.
8. **A default that no longer fits is ignored.** The line's item can change its groups after the package was saved. A default whose item is no longer an option of the line's item, or a group whose defaults now break its rule, gives no choice for that group (the group starts open). The package editor shows "Carrot cake is no longer a snack option" on the line, a derived template warning, and drops it on the next save. Nothing is rewritten in the background.

## Data classes (ADR 0051)
| Data | Class |
|---|---|
| `TicketTemplateLineOption` rows | owned |
| A ticket line's chosen options (option lines) | owned, written from the defaults or the step at create |
| `UNCHOSEN_REQUIRED_GROUP`, a stale default on a package | derived |

## Operations and parity (ADR 0003)
- `ticketTemplate.create|update`: `lines[].options` on GraphQL, REST and MCP; template reads return them.
- `ticket.createFromTemplate`: applies the defaults (decision 7); no input change.
- `line.chooseOptions` and `ticket.create`: same input, the relaxed group rule from decision 5, with the descriptions updated.
- Line reads on every surface: the new warning kind.
- `ticket.previewLines` with `templateIds`: returns each package line's default options, so the intake can prefill the step without another query.

## Consequences
- Migration (expand only): `TicketTemplateLineOption` with foreign keys to the template line and `Item`, unique on (template line, item).
- Core: `checkChoice` skips empty groups; line warnings gain `UNCHOSEN_REQUIRED_GROUP` (one query over the lines' items' required groups and option lines); template schema, create/update and planning take the defaults.
- Web: the intake step (one file per part under `features/ticket/intake/`), the review's open question, the warning on the ticket page and in its issue alerts, and choice controls per line in the package editor. sv and en strings.
- `docs/specs/ticket-intake.md`, `docs/domain-model.md` and `docs/artifacts/domain-model.html` follow.
- Demo seed: the Afternoon break buffet line of a package defaults to Carrot cake. One demo ticket from that package is created with the snack open, so its line shows the warning.

### Slices
1. Core: relaxed group rule, `UNCHOSEN_REQUIRED_GROUP`, adapters, parity tests.
2. Package defaults: table, `ticketTemplate.*` and `createFromTemplate`, the package editor.
3. Intake: the Choices step, the open question in review, the warning on the ticket page; spec, domain model, seed.

## Alternatives rejected
- **Keep the choices in review only, with an open question per required group.** Rejected: review is already the busiest step (calendar, lines table, questions, assignee). The choice is easy to miss there, and it is the thing staff must ask the customer.
- **Block Next until every required group is chosen.** Rejected by the user: the customer often decides the snack later, and staff still need the booking held now.
- **Ask every customisation group in the step.** Rejected by the user: optional groups make the step long for things that rarely matter at intake; they stay in the line dialog.
- **Store defaults as `ItemCustomisationOption` ids.** Rejected: those ids change every time an item's groups are replaced (ADR 0082), so every default would break on the first edit of the item.
- **Store defaults as JSON on `TicketTemplateLine`.** Rejected: ids in JSON (ADR 0056); a default must be a foreign key so an archived item cannot hide behind it.
- **Refuse an item edit that removes an option a package uses.** Rejected: it would tie the catalog to every package that uses it. A stale default is ignored and shown on the package instead (decision 8).

## Settled with the user (2026-11-02)
- Only required groups are asked in the step, together with the line's needs (decision 2).
- Undecided choices never block; they show in review and as a warning on the ticket (decisions 3, 4).
- Packages preselect choices (decision 6); split groups get no defaults.
- Lines fully covered by defaults still show in the step for confirmation (decision 7).
