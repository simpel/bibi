# Floor plans and setup layouts

Behaviour spec for ADR 0099 and 0102 (Accepted; built). Setups and capacity: `docs/specs/configurable-domain.md`. Click prototype: https://claude.ai/artifact/33Myj9sAaodDUiXRHVPv7J

## Words
- **Floor plan**: the drawing of one item with `SETUPS` (in the UI the organization's word for it, usually a room). Size, walls, fixed elements.
- **Setup** (configured once for the organization): the kind of arrangement, e.g. U-shape, Banquet, with its changeover time.
- **Layout**: one named way of furnishing one item in one setup, e.g. "Banquet 80" in Hönö. An item may have several layouts per setup (ADR 0102).
- **Element** (UI: piece of furniture): one thing placed in a plan or a layout. **Kind**: the library entry it comes from ("Round table Ø180, 10 chairs").
- UI copy: "Floor plan", "Layouts", "Furniture"; sv "Planritning", "Möbleringar", "Möbler".

## Entities
- `FloorElementKind` (owned, the organization's library): `name` (unique among active), `shape` (`RECT`, `ROUND`, `SEAT_ROW`, `ZONE`, `DOOR`, `WINDOW`), `swingDeg` (DOOR, WINDOW: 0–180, nullable; doors and windows are always fixed and never seated), `widthCm`, `depthCm`, chairs: `seats` (ROUND around the body, SEAT_ROW along the row) and `seatsTop|Right|Bottom|Left` (RECT, in the piece's own frame), `fixed` (floor plan only), `keepClearCm` (nullable; the area in front of the piece's local bottom side), `status`.
- `FloorPlan` (owned): `itemId` (one per item), `widthCm`, `depthCm`, `outline` (3–64 points in cm, clockwise; any simple room shape: walls never cross or touch, every corner within 0..width and 0..depth), `minAisleCm` (nullable; stored, not checked yet), `version`.
- `SetupLayout` (owned): `itemId`, `setupId` (several per pair; not a child of `ItemSetup`, so an item save never drops a drawing), `name` (unique among the item's active layouts, case-insensitive; nullable only for expand/contract, always written), `note`, `version`, `status`.
- `FloorElement` (owned, replaced as a set by its parent's save): `floorPlanId` xor `setupLayoutId` (CHECK), `kindId`, `position`, `xCm`, `yCm` (centre), `rotationDeg`, own `widthCm`, `depthCm`, `seats`, `seatsTop|Right|Bottom|Left`, `swingDeg` (each null = the kind's), `label`.
- `ItemSetup.capacity` is nullable: `null` = the seats of the item's largest layout for that setup (a layout with no pieces counts for nothing). Every read of an item's setups carries `effectiveCapacity` and `capacitySource` (`MANUAL` typed, `LAYOUT` the seats, `NONE` neither), derived only by `effectiveCapacity` in core. Order planning (`SETUP_CAPACITY`) uses the effective capacity.

## Operations
- `floorElementKind.list|get|create|update|archive|importTemplate` (`configuration:read|write|delete`, like setups). A kind in use cannot be archived (`CONFLICT`). `importTemplate({ template: "conference-banquet" })` creates thirteen starter kinds (a `DOOR` with a 90° swing and a `WINDOW` among them) and skips names that exist.
- `floorPlan.get({ itemId })` (`item:read`): size, outline, fixed elements with effective size and chairs, `setups` (per setup the item has: its largest layout's seats and effective capacity) and `layouts` (every layout with its pieces, for thumbnails). Nothing saved yet: a 10 × 8 m rectangle at version 0. `floorPlan.save` (`item:write`) replaces the plan and its fixed elements (fixed kinds only) and moves every door and window onto the nearest wall, turned so it opens into the room (`snapToWall`); an outline whose walls cross, or with a corner outside the size, is `VALIDATION`.
- `setupLayout.get({ id })` (`item:read`): the pieces, the plan they stand in with its fixed elements, this layout's `seatCount`, the setup's capacity and effective capacity in the item, and `issues`. `setupLayout.create({ itemId, setupId, name, copyFromId? })` (`item:write`, a setup the item has) starts at version 1, empty or as a copy of another layout of the item. `setupLayout.save({ id, … })` (`item:write`) replaces the pieces (no fixed kinds), optionally the name, the note and the setup's typed capacity (`null` = the largest layout's seats, omitted = unchanged). `setupLayout.archive({ id })`. A taken name is `CONFLICT`.
- Both saves take `expectedVersion` (the version loaded, 0 = none); a newer saved version is `CONFLICT` at `expectedVersion`. One audit row per save.
- Issues (derived, client-safe in `@bibi/core/schemas`, never blocking): `OUTSIDE_OUTLINE`, `OVERLAP` (footprints with chairs; zones, doors and windows never count), `KEEP_CLEAR` (a door's swing is its keep-clear area, as deep as the door is wide).
- Parity: GraphQL, REST, MCP. The editor computes the same geometry live from the same functions (`effectiveElement`, `seatPositions`, `footprint`, `layoutIssues`).

## The editors (editing needs `item:write`, reading `item:read`)
- **Two canvas pages in the normal app shell** (ADR 0038, 0102), sidebar on Items: the **floor plan** `/items/:id/floor-plan` (the room: walls, doors, windows, fixed parts; breadcrumb "Items / <item> / Floor plan") and the **layouts** `/items/:id/layouts/<layoutId>` (breadcrumb "Items / <item> / Layouts"). `/items/:id/layouts` opens the first layout, or an empty state with **Create layout**; the old `/layouts/plan` redirects to the floor plan.
- **One toolbar row under the top bar**: on the layouts page `Tabs` on the left (one per layout: its name, its setup's name when different, its seats; scrolls sideways on phones) and **Create layout** (a small dialog: name, setup, start from an empty room or a copy of a layout); the floor plan page has no tabs. Undo, redo and **Save** on the right ("Saved" when nothing has changed). Leaving a tab with unsaved changes asks first ("Leave without saving?").
- **The drawing fills the rest of the viewport** and scales the room to fit; nothing on the page scrolls.
- **Four things sit on the drawing, nothing else:**
  - A **dock** of furniture from the library (icons, name on hover). Click drops the piece in the middle; drag places it where you let go. On the Floor plan tab it shows the fixed kinds only. Phones get a row at the bottom.
  - A **summary** bottom left: "70 seats" (and "capacity 120" when typed in), plus "2 warnings" when there are any. Clicking the warnings selects the next problem and says what it is. Problem pieces are outlined in the warning colour.
  - A **toolbar next to the selection**, only while something is selected: for one piece its **size** (width and depth in cm, the diameter for a round piece, and "Reset to the library's size and chairs") and its **chairs** (a rectangular piece: − n + on each side around a picture of the table, so a table can have chairs on both long sides, one side only or the ends; a round piece or a row: − n +, a row grows from its left end), then rotate 90° (Shift 15°), duplicate, delete. Fixed pieces never show chairs. A door or window shows its width and its **opening angle** (− 90° +, 15° steps, 0 = sliding or a fixed pane) and no rotate: it always follows the nearest wall, while dragged and when a corner moves. With several selected it shows the count. A value equal to the library's is stored as inherited.
  - A **⋯ menu** for what is rare: capacity (type a number, or use the seats), start over from a template, rename the layout (saved with Save) and delete it (confirmed). On the floor plan: edit the room's size (the shape is stretched to it) and make the walls a rectangle.
- **The room's shape** (floor plan page): every corner has a handle and every wall a + in its middle and its length outside it. Drag a corner to move it (10 cm snap, Alt free); press a wall's + to add a corner there and drag it; double-click a corner, or select it and press Delete, to delete it (a triangle is the least). A move that would make walls cross is ignored. Corner changes are undo steps like the pieces'; the saved size is the walls' far edges. A hint next to the summary says how.
- **An empty layout** shows one card: "Start the Classroom layout", a people count and three templates with a thumbnail each (Rows, U-shape, Banquet), plus "Start with an empty room". A template fills the room for that many people, keeps clear of fixed elements and keep-clear zones, and says when not everyone fits.
- **Moving**: drag a piece, or drag on empty floor to select several (Shift-click adds). Snaps to a 10 cm grid; Alt drags without snapping.
- **Keyboard** (no help panel; shortcuts are in the tooltips): arrows move 10 cm (Shift 1 m), `R` rotates, Ctrl+D duplicates, Delete deletes, Ctrl+Z / Ctrl+Shift+Z undo and redo, Esc clears the selection.
- **Not in the first version**: labels in the UI (round tables are numbered as they are added), align and distribute, tracing an image, curved walls (drawn with several corners), moving corners with the keyboard, flipping a door's hinge side (it opens from the left end, into the room), a local browser draft. A stale save shows the `CONFLICT` message as an error toast; reloading the page loads the latest.
- **No library yet**: the page says so; a caller with `configuration:write` imports the starter furniture in one click.
- The item form keeps a setup whose capacity comes from the layout: its field is empty with the placeholder "From the layout"; typing a number makes it a typed capacity.
- Every piece is a focusable SVG group with a label ("Round table 3, 10 seats"); Tab moves between pieces.

## Where layouts show
- **Built**: the item page has **Layouts** next to Edit, shows each setup's effective capacity ("64 (from the layout)") and a **Layouts** section with each setup's layouts as thumbnails linking to them, plus links to the floor plan and the layouts; intake's setup picker and the calendar use the effective capacity.
- **Next**: thumbnails in the setup picker, an order line choosing its layout, the layout on an order line, run sheets drawing each line's layout, and a generative UI view so the assistant's `setupLayout.*` results show the drawing.

## Later slices (not in this spec's scope)
- A booking's own variant of a layout (a snapshot on the line, ADR 0052).
- Kinds linked to an equipment pool and a check of free furniture over time (ADR 0059).
- Elements as bookable items (tables for restaurants, table combinations).
