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
- **The drawing is the page.** Above it: the item's name, undo, redo and **Save** (reads "Saved" when nothing has changed). One row of tabs: "Floor plan", then one tab per setup the item has, each with its capacity. A tab with unsaved changes shows a dot. **Save** saves every changed tab.
- **Four things sit on the drawing, nothing else:**
  - A **dock** of furniture from the library (icons, name on hover). Click drops the piece in the middle; drag places it where you let go. On the Floor plan tab it shows the fixed kinds only. Phones get a row at the bottom.
  - A **summary** bottom left: "70 seats" (and "capacity 120" when typed in), plus "2 warnings" when there are any. Clicking the warnings selects the next problem and says what it is. Problem pieces are outlined in the warning colour.
  - A **toolbar next to the selection**, only while something is selected: − seats +, rotate 90° (Shift 15°), duplicate, delete. With several selected it shows the count instead of the seats.
  - A **⋯ menu** for what is rare: capacity (from the seats, or type a number), start over from a template, copy from another layout. On the Floor plan tab: trace a floor plan image, change the room's size.
- **An empty layout** shows one card: "Start the Classroom layout", a people count and three templates with a thumbnail each (Rows, U-shape, Banquet), plus "Start with an empty room". A template fills the room for that many people, keeps clear of fixed elements and keep-clear zones, and says when not everyone fits.
- **Moving**: drag a piece, or drag on empty floor to select several (Shift-click adds). Snaps to a 10 cm grid; Alt drags without snapping.
- **Keyboard** (no help panel; shortcuts are in the tooltips): arrows move 10 cm (Shift 1 m), `R` rotates, Ctrl+D duplicates, Delete deletes, Ctrl+Z / Ctrl+Shift+Z undo and redo, Esc clears the selection.
- **Not in the first version**: free size per piece, labels, align and distribute. Size and seats come from the kind; the toolbar changes only seats. Table numbers are given in order as tables are added.
- Unsaved edits are kept as a local browser draft per tab. A stale save shows "Someone saved this layout after you opened it" with **Load the latest** and **Keep mine** (see Operations).
- Every piece is a focusable SVG group with a label ("Round table 3, 10 seats"); Tab moves between pieces.

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
