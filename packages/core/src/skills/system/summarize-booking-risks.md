---
name: summarize-booking-risks
description: "Review a planned booking or event request against the rooms and venue data and list risks before confirming: capacity, missing facts, daylight, access and food & beverage details. Use when the user asks 'is this OK?', 'what could go wrong?' or wants a pre-booking check."
allowed-tools: room_get room_list venue_get search
metadata:
  title: "Summarize booking risks"
---

# Summarize booking risks

Goal: a short, prioritised risk list that a coordinator can act on before confirming a booking.

## Gather facts

- From the user: date and time, participant count, rooms or venue, layout, catering
  (meals, special diets and allergies), technical needs and any external partners.
- From Okazi: use `room_get` / `room_list` and `venue_get` for capacity, area, daylight, floor,
  address and contact details. Use `search` if the user names a room or venue loosely.

## Check

1. Capacity: participants above `maxCapacity` is a blocker; above 90 % of it is a warning.
2. Missing data: rooms without `maxCapacity` or `areaSqm` cannot be verified – flag them.
3. Comfort: full-day events in rooms without daylight are a warning.
4. Access: upper floors without information about lifts are a question for the venue.
5. Food & beverage: allergies must be listed per participant, mapped to the EU's 14
   allergens (with severity), and confirmed with the kitchen or the external restaurant partner.
   Diet preferences (vegetarian, vegan, halal, kosher) are listed separately and are not safety flags.
6. Contacts: a venue without `contactEmail` or `contactPhone` makes day-of issues harder.

## Output

Group the findings as **Blockers**, **Warnings** and **Questions**, one line each with the
reason and a suggested action. If nothing is wrong, say so in one sentence. Do not change any
data in this skill; it only reads.
