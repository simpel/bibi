# Floor plans and setup layouts

Behaviour spec for ADR 0099 (Accepted; phase 1 built). Setups and capacity: `docs/specs/configurable-domain.md`. Click prototype: https://claude.ai/artifact/33Myj9sAaodDUiXRHVPv7J

## Words
- **Floor plan**: the drawing of one item with `SETUPS` (in the UI the organization's word for it, usually a room). Size, walls, fixed elements.
- **Layout**: one setup drawn in one item's plan, e.g. "U-shape in Hönö".
- **Element** (UI: piece of furniture): one thing placed in a plan or a layout. **Kind**: the library entry it comes from ("Round table Ø180, 10 chairs").
- UI copy: "Floor plan", "Layouts", "Furniture"; sv "Planritning", "Möbleringar", "Möbler".

## Entities
- `FloorElementKind` (owned, the organization's library): `name` (unique among active), `shape` (`RECT`, `ROUND`, `SEAT_ROW`, `ZONE`), `widthCm`, `depthCm`, chairs: `seats` (ROUND around the body, SEAT_ROW along the row) and `seatsTop|Right|Bottom|Left` (RECT, in the piece's own frame), `fixed` (floor plan only), `keepClearCm` (nullable; the area in front of the piece's local bottom side), `status`.
- `FloorPlan` (owned): `itemId` (one per item), `widthCm`, `depthCm`, `outline` (3–64 points in cm, clockwise; any simple room shape: walls never cross or touch, every corner within 0..width and 0..depth), `minAisleCm` (nullable; stored, not checked yet), `version`.
- `SetupLayout` (owned): `itemId` + `setupId` (unique pair; not a child of `ItemSetup`, so an item save never drops a drawing), `note`, `version`.
- `FloorElement` (owned, replaced as a set by its parent's save): `floorPlanId` xor `setupLayoutId` (CHECK), `kindId`, `position`, `xCm`, `yCm` (centre), `rotationDeg`, own `widthCm`, `depthCm`, `seats`, `seatsTop|Right|Bottom|Left` (each null = the kind's), `label`.
- `ItemSetup.capacity` is nullable: `null` = the layout's seats. Every read of an item's setups carries `effectiveCapacity` and `capacitySource` (`MANUAL` typed, `LAYOUT` the seats, `NONE` neither), derived only by `effectiveCapacity` in core. Order planning (`SETUP_CAPACITY`) uses the effective capacity.

## Operations
- `floorElementKind.list|get|create|update|archive|importTemplate` (`configuration:read|write|delete`, like setups). A kind in use cannot be archived (`CONFLICT`). `importTemplate({ template: "conference-banquet" })` creates twelve starter kinds and skips names that exist.
- `floorPlan.get({ itemId })` (`item:read`): size, outline, fixed elements with effective size and chairs, and per setup the item has its drawn seats and effective capacity. Nothing saved yet: a 10 × 8 m rectangle at version 0. `floorPlan.save` (`item:write`) replaces the plan and its fixed elements (fixed kinds only); an outline whose walls cross, or with a corner outside the size, is `VALIDATION`.
- `setupLayout.get({ itemId, setupId })` (`item:read`, a setup the item has): the pieces, the plan they stand in with its fixed elements, `seatCount` (null = nothing drawn), capacity, effective capacity and `issues`. `setupLayout.save` (`item:write`) replaces the pieces (no fixed kinds), optionally the note and the typed capacity (`null` = use the seats, omitted = unchanged).
- Both saves take `expectedVersion` (the version loaded, 0 = none); a newer saved version is `CONFLICT` at `expectedVersion`. One audit row per save.
- Issues (derived, client-safe in `@bibi/core/schemas`, never blocking): `OUTSIDE_OUTLINE`, `OVERLAP` (footprints with chairs; zones never count), `KEEP_CLEAR`.
- Parity: GraphQL, REST, MCP. The editor computes the same geometry live from the same functions (`effectiveElement`, `seatPositions`, `footprint`, `layoutIssues`).

## The editor (`/items/:id/layouts`; editing needs `item:write`, reading `item:read`)
- **In the normal app shell**, as a full-width canvas page like Calendar and Pipeline (ADR 0038): route `(app)/(canvas)/items/[id]/layouts/[[...tab]]`, sidebar on Items, breadcrumb "Items / <item> / Layouts" (`CrumbName` for the item). `/items/:id/layouts` opens the first layout; `/items/:id/layouts/plan` is the floor plan and `/items/:id/layouts/<setupId>` a layout, so a tab is a link (header in the layout, per "a page whose tabs are in the path"). The item page links here from its layouts section ("Edit layouts").
- **One toolbar row under the top bar**: `Tabs` on the left ("Floor plan", then one per setup the item has, each with its capacity; a dot marks unsaved changes; scrolls sideways on phones), undo, redo and **Save** on the right ("Saved" when nothing has changed; Save saves every changed tab). No page title: the breadcrumb names the page.
- **The drawing fills the rest of the viewport** and scales the room to fit; nothing on the page scrolls.
- **Four things sit on the drawing, nothing else:**
  - A **dock** of furniture from the library (icons, name on hover). Click drops the piece in the middle; drag places it where you let go. On the Floor plan tab it shows the fixed kinds only. Phones get a row at the bottom.
  - A **summary** bottom left: "70 seats" (and "capacity 120" when typed in), plus "2 warnings" when there are any. Clicking the warnings selects the next problem and says what it is. Problem pieces are outlined in the warning colour.
  - A **toolbar next to the selection**, only while something is selected: for one piece its **size** (width and depth in cm, the diameter for a round piece, and "Reset to the library's size and chairs") and its **chairs** (a rectangular piece: − n + on each side around a picture of the table, so a table can have chairs on both long sides, one side only or the ends; a round piece or a row: − n +, a row grows from its left end), then rotate 90° (Shift 15°), duplicate, delete. With several selected it shows the count. A value equal to the library's is stored as inherited.
  - A **⋯ menu** for what is rare: capacity (type a number, or use the seats), start over from a template. On the Floor plan tab: edit the room's size (the shape is stretched to it) and make the walls a rectangle.
- **The room's shape** (Floor plan tab): every corner has a handle and every wall a + in its middle and its length outside it. Drag a corner to move it (10 cm snap, Alt free); press a wall's + to add a corner there and drag it; double-click a corner, or select it and press Delete, to delete it (a triangle is the least). A move that would make walls cross is ignored. Corner changes are undo steps like the pieces'; the saved size is the walls' far edges. A hint next to the summary says how.
- **An empty layout** shows one card: "Start the Classroom layout", a people count and three templates with a thumbnail each (Rows, U-shape, Banquet), plus "Start with an empty room". A template fills the room for that many people, keeps clear of fixed elements and keep-clear zones, and says when not everyone fits.
- **Moving**: drag a piece, or drag on empty floor to select several (Shift-click adds). Snaps to a 10 cm grid; Alt drags without snapping.
- **Keyboard** (no help panel; shortcuts are in the tooltips): arrows move 10 cm (Shift 1 m), `R` rotates, Ctrl+D duplicates, Delete deletes, Ctrl+Z / Ctrl+Shift+Z undo and redo, Esc clears the selection.
- **Not in the first version**: labels in the UI (round tables are numbered as they are added), align and distribute, tracing an image, curved walls (drawn with several corners), moving corners with the keyboard, copying a layout, a local browser draft. A stale save shows the `CONFLICT` message as an error toast; reloading the page loads the latest.
- Leaving a tab with unsaved changes asks first ("Leave without saving?").
- **No library yet**: the page says so; a caller with `configuration:write` imports the starter furniture in one click.
- The item form keeps a setup whose capacity comes from the layout: its field is empty with the placeholder "From the layout"; typing a number makes it a typed capacity.
- Every piece is a focusable SVG group with a label ("Round table 3, 10 seats"); Tab moves between pieces.

## Where layouts show
- **Built**: the item page has **Layouts** next to Edit and shows each setup's effective capacity ("64 (from the layout)"); intake's setup picker and the calendar use the effective capacity.
- **Next**: thumbnails on the item page and in the setup picker, the layout on an order line, run sheets drawing each line's layout, and a generative UI view so the assistant's `setupLayout.*` results show the drawing.

## Later slices (not in this spec's scope)
- A booking's own variant of a layout (a snapshot on the line, ADR 0052).
- Kinds linked to an equipment pool and a check of free furniture over time (ADR 0059).
- Elements as bookable items (tables for restaurants, table combinations).
