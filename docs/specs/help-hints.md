# Help hints

A help hint is a small legend or tip a user closes once with its X. Once closed, it never shows for that user again, on any device.

## When to use one
- Use one for permanent explanation: a visual key (what dashed, faded or red means) or an abstract concept (gates, the status grid, preset vs override).
- Never for state: a warning that something is wrong (unmapped statuses, issues, missing ledger) stays until it is fixed, so it is not dismissible.
- Use one hint per concept, not per page: the same id on several pages closes it everywhere.

## Placement
- **Legend** (`floating`): fixed at the bottom centre of the screen, above the page and clear of the pinned tray on the right.
- **Tip** (inline): a muted box in the page's flow, near what it explains.

## How it works
- Ids are listed in `apps/web/src/components/help/help-hints.ts`. An id is lowercase (`a-z`, `0-9`, `-`), because it becomes a preference key.
- Closing a hint stores the user preference `help.dismissed.<id>` = `true` (ADR 0039). The app layout loads `help.dismissed.*` once, so a closed hint never flashes on load.
- `HelpHint` (web) wraps `HelpPanel` (`@bibi/ui`), which is presentational and knows nothing about storage.
- To show a hint to everyone again, give it a new id.

## Hints
| Id | Kind | Where | Explains |
|---|---|---|---|
| `card-legend` | legend | My work, Pipeline, Orders | The card cues (spec: home, Tone): preliminary, following, past, blocked, needs fixing, live (My work only). |
| `calendar-legend` | legend | Calendar, read-only order calendar | The states on screen, buffers, solid (booked) vs striped (preliminary), and the red clash badge. |
| `setup-preview-legend` | legend | Pipeline setup preview | Solid, striped and outline slots in the mini calendar. |
| `status-flow` | tip | Status flow editor | "May move to" (where an order may go next) vs gates (what moving into a status needs). |
| `status-grid` | tip | Status grid | Rows are statuses, columns are item types, a cell is the state a line gets; Keep leaves lines as they are. |
| `board-customize` | tip | Pipeline, customize mode | Columns are phases, chips are statuses, drag to move; a status in no column is hidden. |
| `assistant-approval` | tip | Assistant approval card | The assistant proposes; nothing changes until you approve; a proposal expires. |
| `quote-draft` | tip | Quote, draft | A draft quote's lines are edited on the order. |
| `inbox-address` | tip | Inbox | What the inbound email address does. |
| `permission-grid` | tip | Member and API key permissions | The role gives a preset; allow/deny overrides beat it; denying read hides the feature. |
| `run-sheet-versions` | tip | Run sheet versions | Draft, Pending, Fulfilled and Revision pending; a change makes a new version to send again. |
| `run-sheet-definition` | tip | Run sheet definition wizard | Types give rows, fields give columns, lists count needs, the responsibility receives it. |
| `item-capabilities` | tip | Item type capabilities | What each section switches on; a section with data cannot be switched off. |
| `dashboard` | tip | Data, Workload | What Needs attention lists, how utilisation is computed, counts are neutral. |
| `forecast` | tip | Data, Forecast | Confirmed vs projected vs expected invoiced; the pipeline is no promise. |
