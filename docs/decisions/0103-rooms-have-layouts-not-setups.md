# 0103 – Rooms have layouts, not setups; a people limit and emergency exits

- **Date:** 2026-11-10
- **Status:** Accepted
- **Related:** 0099 and 0102 (amended), 0059 (buffers amended), 0021, 0051, 0052, 0053
- **Spec:** `docs/specs/floor-plans-and-layouts.md`

## Context
- A room's arrangement is spread over three entities: the organization's `Setup` (name, changeover), the room's `ItemSetup` (capacity) and `SetupLayout` (drawing). Staff think of one thing: "Asperö as a banquet for 60".
- The changeover time lives on the shared setup, so Classroom cannot take 30 minutes in Hönö and 60 in Vinga.
- An order line books room + setup, so a run sheet cannot show the drawing that was actually booked.
- Rooms have a legal people limit (fire safety, ventilation) that nothing checks, and an emergency exit can be furnished shut without a warning.

## Decision
1. **A room has one floor plan and several layouts; there is no shared setup.** A layout (`SetupLayout`, operations renamed `layout.*`) has: name (unique in the room), an optional **description** (what it is suited for), a **capacity** (`null` = its seats), **setup and teardown minutes** (`null` = inherit) and an optional drawing. A layout with no pieces is fine ("Standing reception, 120").
2. **An order line and an order template line book room + layout** (`layoutId`, a layout of the line's item) instead of room + setup. Capacity checks use the layout's effective capacity.
3. **Buffers (amends ADR 0059):** setup and teardown minutes inherit line → layout → item → type; the first value set wins. The "larger of the inherited time and the setup's changeover" rule goes.
4. **A people limit on the room, as a hard limit:** `Item.maxPeople` (nullable = no limit). Saving a layout whose effective capacity is above it, or an order line with more people than it, is `VALIDATION` with the limit in the message. Lowering the limit below a layout's capacity or an upcoming line's people is `CONFLICT`, naming them.
5. **Emergency exits, as a hard limit:** a door or window in the floor plan can be marked `emergencyExit`. It is drawn as an exit and gets a no-block zone in front of it (at least 150 cm deep and as wide as the opening plus 20 cm on each side). Saving a layout with a piece in that zone is `VALIDATION` (`EXIT_BLOCKED`, naming the pieces); marking an exit, or moving it, so that an existing layout blocks it is `CONFLICT`, naming the layouts. Every other drawing warning stays advisory.
6. **Migration (expand, then contract in a later release, ADR 0013):** every `ItemSetup` becomes a layout of its room (the setup's name, the typed capacity, the setup's changeover as setup minutes) unless the room already has a layout for that setup, which takes the capacity and changeover instead. Lines and template lines get the layout of their item and setup. `Setup`, `ItemSetup`, `Line.setupId` and `SetupLayout.setupId` are dropped in the following release.

## Rejected
- **Keep the shared setup and add a per-room changeover** (`ItemSetup.changeoverMinutes`). Fixes the times but keeps three entities for one idea and still books lines without a drawing.
- **A shared "style" list on layouts** for searching across rooms. Capacity and the description answer "which room for 80"; a list can be added later as an optional field without changing this model.
- **The people limit as an organization-defined field.** Bibi must compare it with capacities and headcounts, so it is a column, not a field value.
- **Warnings only for the people limit and exits.** These are legal fire-safety limits; a warning that staff can ignore lets a booking break the law. Every other drawing check (overlap, outside the walls, a door's swing) stays a warning (ADR 0099).

## Consequences
- Breaking for API callers: `setup.*` and `setupLayout.*` go, `layout.*` comes; lines and templates take `layoutId`. Acceptable before the first paying venue.
- The `SETUPS` capability keeps its stored key in this release and is called "Layouts" in the UI; renaming a stored enum value is a contract step (ADR 0013) and follows with the drops. Intake, the calendar, order lines, run sheets, MCP, seed and the domain model change in the same release.
- `sync_line_occupancy.sql` reads the layout's buffer minutes instead of the setup's changeover; its trigger moves from `Setup.changeoverMinutes` to the layout's minutes.
- Run sheets can draw a line's layout (a later slice).
- Existing data is not checked by the migration: a layout or line already over a limit keeps loading but cannot be saved again until it fits. The demo seed stays within every limit.
