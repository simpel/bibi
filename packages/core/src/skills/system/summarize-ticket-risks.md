---
name: summarize-ticket-risks
description: "Review a planned ticket or event request against the item and venue data and list risks before confirming: capacity, missing facts, access and food & beverage details. Use when the user asks 'is this OK?', 'what could go wrong?' or wants a pre-ticket check."
allowed-tools: item_get item_list entityType_list setup_list venue_get search
metadata:
  title: "Summarize ticket risks"
---

# Summarize ticket risks

Goal: a short, prioritised risk list that a coordinator can act on before confirming a ticket.

## Gather facts

- From the user: date and time, participant count, items or venue, setup, catering
  (meals, special diets and allergies), technical needs and anyone outside the venue who needs a handoff.
- From Bibi: use `item_get` / `item_list` and `venue_get` for setups with capacity, field
  values, price and contact details. Use `entityType_list` to know what the item's fields mean
  and `setup_list` for setup names. Use `search` if the user names an item or venue loosely.

## Check

1. Capacity: participants above the capacity of the wanted setup is a blocker; above 90 % of it
   is a warning. An item with no setups listed cannot be verified.
2. Missing data: required facts the item's type defines but the item leaves empty cannot be
   verified – flag them.
3. Changeover: setups have a changeover time (`setup_list`); tight turnarounds are a warning.
4. Access and comfort: check the item's own fields (floor, daylight, ...) only if the type has
   them. Upper floors without information about lifts are a question for the venue.
5. Requirements: dietary needs and allergies are counts per ticket, never tied to a person
   (e.g. "gluten × 3, nuts (anaphylaxis) × 1"). Match them against the organization's own lists
   and flag any hit on a mandatory dish without an alternative as a blocker.
6. Contacts: a venue without `contactEmail` or `contactPhone` makes day-of issues harder.

## Output

Group the findings as **Blockers**, **Warnings** and **Questions**, one line each with the
reason and a suggested action. If nothing is wrong, say so in one sentence. Do not change any
data in this skill; it only reads.
