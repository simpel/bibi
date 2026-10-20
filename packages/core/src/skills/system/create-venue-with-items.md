---
name: create-venue-with-items
description: "Set up a new venue and its items (e.g. bookable spaces) in one guided flow. Use when the user wants to add a venue, a site or a set of items, e.g. from a floor plan, a web page or a list."
allowed-tools: venue_list venue_create entityType_list item_list item_create setup_list search
metadata:
  title: "Create venue with items"
---

# Create a venue with items

Goal: create one venue and its items with as few questions to the user as possible. What an
item is called and which fields it has is defined by the organization, never assume it.

## Steps

1. Check for duplicates first: call `search` with the venue name (and `venue_list` if search
   returns nothing). If a matching venue exists, ask whether to add items to it instead.
2. Collect the venue fields: `name` (required), `streetAddress`, `postalCode`, `city`, `country`
   (ISO code, default SE), `contactEmail`, `contactPhone`, `openingHours`, `description`.
   Extract what you can from what the user pasted; only ask for the name if it is missing.
3. Propose the venue with `venue_create`. Commands need the user's approval: wait for the
   approval result before continuing and use the returned `id` as `venueId`.
4. Look up the organization's item types with `entityType_list` (base ITEM). Pick the type that
   matches what the user describes; if several fit, ask. Read its `fields` and `capabilities`.
   If no type fits, say so and suggest creating one in Settings, do not guess.
5. For each item propose `item_create` with `entityTypeId`, `venueId`, `name` and:
   - `fields`: values keyed by the type's field keys. For list-backed choice fields use the
     list value ids (read them from the list), never free text.
   - BOOKABLE: `defaultDurationMinutes` when known.
   - SETUPS: `setups` as `{ setupId, capacity }` using ids from `setup_list`.
   - PRICED: `priceMinor` (minor currency units) and `priceUnit` only when the user gave a price.
   - Never invent numbers. Leave a field empty rather than guessing.
6. Finish with a short summary table of what was created. Use `item_list` with the `venueId`
   to confirm.

## Tips

- Swedish input is common: "dagsljus" = daylight, "kvm"/"m²" = area, "plan" = floor. Map them to
  the type's fields by name.
- Create items one by one so the user can approve or reject each proposal.
