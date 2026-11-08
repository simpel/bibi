# 0099 – Floor plans and setup layouts: drawn per item, furniture from the organization's library, capacity inherited from seats

- **Date:** 2026-11-08
- **Status:** Accepted
- **Related:** 0021, 0026, 0051, 0052, 0056, 0059, 0063, 0003, 0007
- **Spec:** `docs/specs/floor-plans-and-layouts.md`

## Context
- A setup (U-shape, Cinema) is only a name with a changeover time. Capacity per bookable item and setup (`ItemSetup.capacity`) is typed by hand and nothing shows what the room looks like.
- Venues hand setup crews a sketch on paper. Restaurants with private rooms and conference venues ask for a drawing they can reuse and send.
- Seat counts drift from the typed capacity when the room is refurnished.
- Later slices need geometry: a booking's own variant of a layout, a check against free furniture (ADR 0059 pools) and tables as bookable items for restaurants.
- The code must stay free of domain words (ADR 0021): "room", "table" and "chair" are the organization's words, not ours.

## Decision
1. **A floor plan per item with `SETUPS`** (`FloorPlan`, one per item): the size in centimetres, an outline of points, an optional background image (`backgroundKey` in `packages/storage`) and an optional minimum aisle. Its elements are the fixed parts shared by every layout (a door, a pillar, a screen).
2. **A layout per item and setup** (`SetupLayout`, unique on item and setup, not a child of `ItemSetup`, which `item.*` replaces as a set), with its own elements. A layout is drawn on top of the plan's fixed elements.
3. **Elements are rows** (`FloorElement`, in exactly one plan or one layout) with position and rotation, and size and seats that inherit from their kind (`null` = inherit). Units are integer centimetres and whole degrees.
4. **The organization owns the library** (`FloorElementKind`, `configuration:*`): name, a generic shape (`RECT`, `ROUND`, `SEAT_ROW`, `ZONE`), default size, chairs (per side for `RECT`, around or along for the others), `fixed` (plan only) and an optional keep-clear distance. A placed piece may override its size and chairs per side. A starter template ("Conference and banquet furniture") imports common kinds as data.
5. **Capacity inherits from the layout.** `ItemSetup.capacity` becomes nullable: `null` means the layout's seat count. A number is an override (a standing reception has no seats). Derived on read: `effectiveCapacity` with its source (`LAYOUT`, `MANUAL`). Existing capacities stay as overrides.
6. **A plan and a layout are each saved as a whole** (`floorPlan.save`, `setupLayout.save`), with a `version` for optimistic concurrency (`CONFLICT` on a stale save). One audit row per save, not per element.
7. **Warnings are derived on read, never stored, never blocking**: outside the outline, overlapping elements, an element in a keep-clear zone (an aisle check against `minAisleCm` comes later).
8. **Permissions are the catalog's** (`item:read`, `item:write`; the library is `configuration:*` like setups). Every operation exists on web, GraphQL, REST and MCP. The assistant proposes a whole layout and the user approves the preview.
9. **One SVG renderer in `@bibi/ui`** draws the editor, the read-only view, the generative UI result and the run sheet PDF.

## Rejected
- **A fixed furniture enum in code** (table, chair, stage). Domain words in code, and every venue has its own furniture.
- **A JSON document per layout.** Breaks references as foreign keys (ADR 0056) and blocks the furniture pool check.
- **Capacity always derived from seats.** A standing layout has no seats, and an override would then need a second column.
- **Layouts per setup only, shared by every item.** Rooms differ in size and shape. A U-shape for 24 in one room is not the U-shape in another.
- **A canvas library (Konva, Fabric) or React Flow.** Canvas output is poor in PDF and for accessibility. React Flow is built for node graphs and fights rotation, metre scale and snapping.
- **Saving per element.** Every drag would be a command, an audit row and a race with the other editor.

## Consequences
- `ItemSetup.capacity` becomes nullable and every read of capacity switches to `effectiveCapacity` (intake, `order.previewLines` `SETUP_CAPACITY`, line dialog, MCP).
- `docs/domain-model.md` and its HTML gain four entities once this ADR is accepted.
- A per-booking variant of a layout, the furniture pool check and bookable tables are later slices, each building on these rows.
- The demo seed gets a plan and two layouts for one room per demo organization.
