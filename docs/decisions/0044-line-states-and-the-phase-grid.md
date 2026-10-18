# 0044 – Line states, the phase grid and guided setup

- **Date:** 2026-10-18
- **Status:** Accepted
- **Related:** 0021 (configurable items), 0043 (ticket and phases), 0022 (occupancy and options, partly superseded), 0036 (calendar view)
- **Supersedes:** `Option` and the occupancy types `BOOKING`/`OPTION` in 0022

## Context
- A ticket allocates things: rooms, food, activities. What "allocated" means changes during the ticket's life. In a lead, a room is only held softly ("prebooked"). After the deal it is "booked". After a cancellation it is released. Food is "estimated", then "ordered", then "locked" at the final count.
- Organizations need to see and control that flow, because it changes as lines are added, removed and changed. Staff also need to see each line's state in the calendar.
- ADR 0022 handles this with a separate `Option` entity and fixed occupancy types. It cannot express "ordered" for food or any organization-specific state.

## Decision

### Every item type has its own states
- `ItemState` (per `EntityType` of base `ITEM`): name, color, position and the **state flags** below. The organization defines them. Every type has at least one state and exactly one **initial state**.
- State flags are generic:

  | Flag | The system does |
  |---|---|
  | `hold` | `NONE`, `SOFT` or `HARD`. Only for types with `BOOKABLE` (ADR 0021). `SOFT` holds the item without blocking others and queues by rank. `HARD` blocks it. |
  | `inSheets` | Lines in this state are included in generated sheets. |
  | `released` | Final state. The hold is dropped. Nothing leaves it. |
  | `expires` | A soft hold carries an expiry date and falls to the type's `expiryStateId` when it passes (replaces option expiry, ADR 0027). |

- Types without `BOOKABLE` use `hold = NONE` and the other flags only. Food, drinks and activities get their own state lists, usually short.
- State transitions between states of one type are data (`ItemStateTransition`) with the default "every forward move and to released".

### Lines carry the state
- A line (`ProgramItem`, ADR 0043) has `stateId`, `stateOverridden` and, for a soft hold, `expiresAt`. The line's occupancy is **derived**: a `SOFT` state creates a soft occupancy, `HARD` a blocking one, `NONE`/`released` none. The exclusion constraint stays: hard holds, setup, maintenance and internal blocks never overlap on one item; soft holds may.
- Soft holds on the same item and time queue by rank, kept in step by core as today (ADR 0022). A hard hold sorts ahead of every soft hold, and the soft holds behind it keep their rank but are marked "blocked".
- `SETUP`, `MAINTENANCE` and `INTERNAL` occupancy stay as manual or derived blocks.

### The phase grid
- `PhaseStateRule(phaseId, entityTypeId, stateId)`: when a ticket **enters** a phase, its lines of that type move to that state. The grid is phases × item types.
- **Cells are optional.** An empty cell means "keep the state". A new line gets the state of its cell for the ticket's current phase, or the type's initial state when the cell is empty.
- Terminal phases (ADR 0043) ignore the grid and release every line.
- Entering a phase moves every line that is not overridden and whose cell is set. The transition from the line's current state to the cell's state must be allowed by the type's state transitions; if it is not, the line is reported as a blocker.
- The whole phase move is atomic. A collision on a hard hold, a disallowed state transition or a missing assignee refuses the move and lists every blocker (`CONFLICT` with `issues`), for example "Room Knippla is booked by ticket #42 on 14 Mar".

### Overrides
- Staff can set a single line to any allowed state at any time (`line.changeState({ lineId, stateId })`): "the mingle drink is ordered while the ticket is still a lead".
- The line is then `stateOverridden`. Phase moves skip it. `line.followPhase` clears the flag and applies the current phase's cell. Terminal phases still release it.
- Changing a line's state follows the same hold checks as a phase move.

### Calendar
- The calendar (ADR 0036) draws each occupancy in its state's color: hard holds solid, soft holds hatched, released not shown. A legend comes from the organization's states.
- Filters: state, phase, ticket, item type. Each block links to the ticket and shows the line's state name.

### Removing and renaming states
- Rename and recolor are free. Removing a state is archiving, and requires a **target state** of the same type when lines use it. Lines move in one logged operation; rules that reference the state (grid cells, `expiryStateId`) move with it or are cleared.
- The initial state cannot be archived until another is chosen. A type keeps at least one state.

### Guided setup
- A wizard at `/onboarding/pipeline` (built on `components/wizard`, ADR memory: step pages) leads an admin through the order that makes the grid easy:
  1. **Item types** – which types the organization uses (rooms, food, activities). Reuses `entityType.*`.
  2. **States per type** – start from the template for the type's behavior (bookable: Prebooked, Booked, Released; food: Estimated, Ordered, Locked, Released; other: Planned, Confirmed, Released) or one state "Active".
  3. **Phases** – a template list with the flags shown as plain choices (does this phase end the ticket? does it need a reason?).
  4. **The grid** – phases down, types across, each cell a dropdown or "keep". Pre-filled from the template.
  5. **Preview** – a simulated ticket with one line per type is stepped through every phase. The wizard shows each line's state and a mini calendar with the holds, and lists configuration problems (no entry or terminal phase, a state nothing can leave, a type with no initial state).
  6. **Activate** – creates everything through the normal operations as one audited batch.
- The wizard runs when an organization has no phases. Afterwards the same data is edited on `/settings/pipeline` and `/settings/item-states`. Templates ("Conference estate") fill all steps and can be changed freely.

### Commands
- `itemState.list|get|create|update|archive|reorder|setTransitions`, `phaseGrid.get|setCell|importTemplate`, `line.changeState`, `line.followPhase`, `pipelineSetup.preview|activate`. Permissions: `itemState:read|admin`, `phaseGrid:read|admin`, `programItem:write` for line commands.
- All operations on all four surfaces. AI proposes, the user approves (ADR 0007). AI can suggest a full setup from a description of the organization.

## Consequences
- `Option` and its operations are removed. `option.expireDue` becomes `line.expireDue` (job, ADR 0027). Soft-hold rank moves to the line.
- `OccupancyType` loses `BOOKING` and `OPTION` for `HOLD` with a `holdKind` (`SOFT`/`HARD`) plus a link to the line's state.
- `ProgramItem` gets `stateId`, `stateOverridden`, `expiresAt`, `rank`. It may be renamed `TicketLine` in a follow-up; not decided here.
- Sheets use `inSheets` to choose lines, so a sheet only contains what the organization has marked as sendable.
- The domain model, ER diagram and glossary change: Inquiry, Booking and Option are removed, Ticket, TicketPhase, ItemState and PhaseStateRule are added (`docs/domain-model.md` and `docs/artifacts/domain-model.html` together).
- The demo seed gets per-organization phases, states and grids (ADR 0025).

## Open questions
- Should a state change on a line notify the line's responsibility (ADR 0034), e.g. the head of kitchen when a food line becomes "Ordered"? Deferred until notifications exist.
- Lines with only a quantity and no item (free-text) are not covered; they get the initial state of a default type.
