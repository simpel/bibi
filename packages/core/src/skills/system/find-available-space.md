---
name: find-available-space
description: "Find bookable items that fit a meeting or event: number of people, size, features, location. Use when the user asks which space or venue suits a group, e.g. 'a space for 40 with daylight in Göteborg'."
allowed-tools: search item_list item_get entityType_list setup_list venue_list venue_get
metadata:
  title: "Find available space"
---

# Find space for a meeting or event

Goal: shortlist bookable items that fit the request and explain why each one fits.

## Steps

1. Pin down the requirements: number of participants, date and time, setup (e.g. theatre,
   classroom, banquet), features (daylight, accessibility), city or venue. Ask at most one
   short follow-up question if the participant count is missing.
2. Learn the organization's model: call `entityType_list` and use the types with capability
   BOOKABLE. Their `fields` tell you what can be filtered on (area, floor, daylight, ...).
3. Search broadly: call `search` with the request in the user's own words, restricted to
   `entityTypes: ["item"]`. Then call `item_list` with `capability: "BOOKABLE"` (optionally
   `venueId` or `entityTypeId`) to cover items that search missed.
4. Filter strictly on hard requirements: a setup capacity (`setups[].capacity`, names from
   `setup_list`) must be at least the participant count for the wanted setup (any setup if none
   is named); other requirements are checked against the item's `fields`. Use `item_get` and
   `venue_get` for details.
5. Rank by fit: the smallest item that still fits comes first. Show at most five options with
   capacity per setup, the relevant field values and the venue.

## Availability

Okazi does not yet expose tickets or calendars to the assistant. Say clearly that the list is
based on item data only and that availability for the date must be checked before ticket.
Never claim that something is free.
