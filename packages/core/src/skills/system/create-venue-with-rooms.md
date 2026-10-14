---
name: create-venue-with-rooms
description: "Set up a new venue (anläggning) and its bookable rooms in one guided flow. Use when the user wants to add a venue, a site or a set of rooms, e.g. from a floor plan, a web page or a list."
allowed-tools: venue_list venue_create room_list room_create search
metadata:
  title: "Create venue with rooms"
---

# Create a venue with rooms

Goal: create one venue and all of its rooms with as few questions to the user as possible.

## Steps

1. Check for duplicates first: call `search` with the venue name (and `venue_list` if search
   returns nothing). If a matching venue exists, ask whether to add rooms to it instead.
2. Collect the venue fields: `name` (required), `streetAddress`, `postalCode`, `city`, `country`
   (ISO code, default SE), `contactEmail`, `contactPhone`, `openingHours`, `description`.
   Extract what you can from what the user pasted; only ask for the name if it is missing.
3. Propose the venue with `venue_create`. Commands need the user's approval: wait for the
   approval result before continuing and use the returned `id` as `venueId`.
4. For each room propose `room_create` with `venueId`, `name` and, when known, `maxCapacity`,
   `areaSqm`, `floor`, `hasDaylight`, `ceilingHeightM`, `description`.
   - Capacity is the largest seating layout the user mentions (e.g. "theatre 120, classroom 60"
     → 120) and mention the other layouts in `description`.
   - Never invent numbers. Leave a field empty rather than guessing.
5. Finish with a short summary table: room, capacity, area, daylight. Use `room_list` with the
   `venueId` to confirm what was created.

## Tips

- Swedish input is common: "dagsljus" = daylight, "kvm"/"m²" = areaSqm, "plan" = floor.
- Create rooms one by one so the user can approve or reject each proposal.
