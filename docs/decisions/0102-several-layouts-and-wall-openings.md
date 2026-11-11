# 0102 – Several layouts per setup, and doors and windows as wall openings

- **Date:** 2026-11-10
- **Status:** Accepted
- **Related:** 0103 (amends this), 0099 (amends decisions 2, 4 and 5), 0021, 0051, 0052
- **Spec:** `docs/specs/floor-plans-and-layouts.md`

## Context
- ADR 0099 allows one layout per item and setup (`SetupLayout` unique on `itemId, setupId`). Venues furnish the same room in the same setup in several ways: "Banquet 60" with round tables and "Banquet 80" with long tables.
- A door is a fixed `RECT` with a keep-clear distance. It can be placed anywhere in the room, takes chairs like a table and has no swing. There are no windows.
- The floor plan and the layouts share one editor and one row of tabs, so the room's walls and the furniture of one setup read as the same thing.

## Decision
1. **A layout has a name and many layouts may share an item and setup.** The unique key `(itemId, setupId)` is dropped; `SetupLayout.name` is added (unique among an item's active layouts). Existing layouts are named after their setup. `setupLayout.get|save` take the layout's `id`; `setupLayout.create` (name, setup, optional copy of another layout) and `setupLayout.archive` are added. Permissions stay `item:read|write`.
2. **A setup's capacity in a room is its largest layout.** `ItemSetup.capacity = null` now means the most seats of the item's layouts for that setup (`effectiveCapacity`, source `LAYOUT`). A typed number still overrides. An order line choosing its layout is a later slice (with the line snapshot of ADR 0052).
3. **Doors and windows are shapes.** `FloorShape` gains `DOOR` and `WINDOW`, always `fixed`, never seated. Both sit on a wall: the editor snaps them to the nearest wall of the outline, turned along it, and moves them with the wall when a corner moves. A kind and a placed element gain `swingDeg` (0–180; 0 = sliding door or fixed pane; null on an element = the kind's). Width is `widthCm`; depth is the wall's and not edited. A door's swing is its keep-clear area for warnings.
4. **The UI splits the two.** `/items/:id/floor-plan` edits the room (walls, doors, windows, pillars); `/items/:id/layouts/:layoutId` edits one layout. The item page lists each setup with a thumbnail per layout.

## Rejected
- **Layouts free of setups** (a setup as an optional tag). Capacity per setup, intake and the calendar all read by setup; an untagged layout would count for nothing.
- **A default layout per setup** for capacity. One more flag to keep in step; the largest layout is what "fits up to" means.
- **One `OPENING` shape with a flag.** The drawing and the editor branch on it anyway.
- **Storing a door as a wall index and offset.** Breaks when a corner is added or deleted; snapping on edit keeps the plain centre-and-rotation rows of ADR 0099.

## Consequences
- A migration drops the unique index, adds `name` (backfilled) and `swingDeg`, and adds the two enum values. MCP, GraphQL and REST change `setupLayout.get|save` from `itemId, setupId` to `id` (breaking for API callers, acceptable before the first paying venue).
- `floorPlan.get` lists layouts instead of one entry per setup; the seed gets a second layout for one setup, a door and a window.
- The starter library's "Door" becomes a `DOOR` with a 90° swing; a "Window" is added.
