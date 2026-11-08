# Floor plans and setup layouts

Behaviour spec for ADR 0099 (Proposed, not built). Setups and capacity today: `docs/specs/configurable-domain.md`. Click prototype: https://claude.ai/artifact/33Myj9sAaodDUiXRHVPv7J

## Words
- **Floor plan**: the drawing of one bookable item with `SETUPS` (in the UI, the organization's word for it, usually a room). Size, walls, fixed elements.
- **Layout**: one setup drawn in one item's plan, e.g. "U-shape in Sjöstugan".
- **Element**: one thing placed in a plan or a layout. **Kind**: the library entry it comes from ("Round table Ø180, 10 seats").
- UI copy: "Floor plan", "Layout", "Furniture"; verbs per the taxonomy (Create layout, Add furniture, Edit, Delete, Save).

## Entities
- `FloorPlan` (owned): `itemId` (unique), `widthCm`, `depthCm`, `outline` (points in cm, clockwise; default the rectangle), `backgroundKey` (nullable, storage key), `backgroundScale` (cm per image pixel, nullable), `minAisleCm` (nullable = no aisle check), `version`.
- `SetupLayout` (owned): `itemSetupId` (unique), `version`, `note` (≤ 2000).
- `FloorElement` (owned): `floorPlanId` xor `setupLayoutId`, `kindId`, `xCm`, `yCm` (centre), `rotationDeg` (0–359), `widthCm`, `depthCm`, `seats` (each nullable = the kind's), `label` (≤ 40, e.g. table number).
- `FloorElementKind` (owned, organization library): `name` (unique), `shape` (`RECT`, `ROUND`, `SEAT_ROW`, `ZONE`), `widthCm`, `depthCm`, `seats` (≥ 0), `seatPlacement` (`AROUND`, `ONE_SIDE`, `TWO_SIDES`, `ENDS`, `NONE`), `fixed` (plan only), `keepClearCm` (nullable), `status`.
- `ItemSetup.capacity` becomes nullable: `null` = the layout's seats. Read model adds `effectiveCapacity` and `capacitySource` (`LAYOUT`, `MANUAL`, `NONE`).
- A layout without a plan uses the default rectangle of the plan's size; an item without a plan has no layouts (the editor creates the plan first).

## Operations
- `floorElementKind.list|get|create|update|archive|importTemplate` (`item:read|write|delete`). A kind in use cannot be archived (`CONFLICT`). `importTemplate({ template: "conference-banquet" })` is idempotent by name.
- `floorPlan.get({ itemId })` returns the plan, its elements with effective size and seats, its layouts (setup, seats, effective capacity) and `issues`. `floorPlan.save({ itemId, expectedVersion, plan, elements[] })` replaces the plan and its elements (`item:write`); a missing plan is created at version 1.
- `setupLayout.get({ itemSetupId })` returns the layout, its elements, the plan's fixed elements, the seat count, `issues`. `setupLayout.save({ itemSetupId, expectedVersion, note, elements[] })` replaces the elements. `setupLayout.copy({ fromItemSetupId, toItemSetupId })` copies elements between layouts of the same item (refused if the target has elements unless `replace: true`).
- A stale `expectedVersion` is `CONFLICT` with the current version and its author; the editor offers "Load the latest" (discards local edits) or "Keep mine" (saves against the new version).
- Every save validates: kinds active and in the organization, a `fixed` kind only in a plan, sizes 10–5000 cm, elements centred inside the plan's bounding box. Geometry problems are issues, not errors.
- Issues (derived on read and in the editor live, same module in core, client-safe): `OUTSIDE_OUTLINE`, `OVERLAP` (two elements, `ZONE` excluded), `KEEP_CLEAR` (an element in a kind's keep-clear distance), `NARROW_AISLE` (gap under `minAisleCm`), `SEATS_UNDER_HEADCOUNT` only in a booking context.
- Parity: GraphQL, REST (`/items/{id}/floor-plan`, `/item-setups/{id}/layout`), MCP tools. The MCP result renders as the read-only layout in chat (generative UI `FloorLayoutView`).

## The editor (`/catalog/items/:id/floor-plan`, `item:write`)
- **Layout**: canvas in the middle, library on the left, properties of the selection on the right, layout tabs on top: "Floor plan" first (fixed elements only), then one tab per setup the item has, then **+ Create layout** (picks a setup the item lacks and adds its `ItemSetup`).
- **Starting a plan**: width and depth in metres, or **Trace a floor plan image**: upload an image, click two points and type the distance between them to set the scale, then drag the corners of the outline.
- **Placing**: drag a kind from the library onto the canvas, or click it to drop it in the centre. Snaps to a 10 cm grid and to the edges and centres of other elements (guides shown); Alt drags without snapping.
- **Editing**: click to select, Shift-click or drag a box for several. Drag to move, the handle to rotate (15° steps, Shift for free), arrow keys move 10 cm (Shift 1 m), `R` rotates 90°, Ctrl+D duplicates, Delete deletes, Ctrl+Z / Ctrl+Shift+Z undo and redo. Align and distribute for a multi-selection.
- **Properties**: label, seats (shown as "10 (from kind)" until changed), width and depth, rotation, and **Reset to kind**.
- **Generators** (each places elements as a normal edit, undoable):
  - Rows of seats: rows, seats per row, aisle in the middle or on the sides, spacing.
  - U-shape, boardroom and classroom for N people, from the chosen table kind.
  - Banquet: N people at round tables of a chosen kind, staggered, keeping `minAisleCm`.
- **Status bar**: seats in this layout, the effective capacity and its source ("Capacity 64, from the layout" or "Capacity 120, typed in" with **Use the layout's seats**), live issues as a count that opens a list; clicking an issue selects its elements.
- **Save** saves the open tab; switching tab with unsaved changes asks Save or Discard. Unsaved edits are kept as a local browser draft per tab.
- **Copy from**: copies another layout's elements into the open tab (asks before replacing).
- Keyboard and screen readers: every element is a focusable SVG group with a label ("Round table 3, 10 seats"); Tab moves between elements.

## Where layouts show
- **Item page**: a "Floor plan" section with thumbnails of the plan and each layout, seats and capacity.
- **Intake and line dialog**: the setup picker shows each setup's thumbnail and capacity compared with the headcount ("64 seats, 70 guests" as a warning).
- **Order line**: the chosen layout as a thumbnail; clicking opens it read-only.
- **Run sheets**: a run sheet definition can include layouts; the PDF draws each line's layout with its time and changeover, and the json export carries the elements.
- **Assistant**: "draw a U-shape for 24 in Sjöstugan" proposes `setupLayout.save`; the approval card shows the drawing.

## Later slices (not in this spec's scope)
- A booking's own variant of a layout (a snapshot on the line, ADR 0052).
- Kinds linked to an equipment pool and a check of free furniture over time (ADR 0059).
- Elements as bookable items (tables for restaurants, table combinations).
