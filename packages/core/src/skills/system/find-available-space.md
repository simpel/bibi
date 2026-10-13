---
name: find-available-space
description: "Find rooms that fit a meeting or event: number of people, daylight, size, location. Use when the user asks which room or venue suits a group, e.g. 'a room for 40 with daylight in Göteborg'."
allowed-tools: search room_list room_get venue_list venue_get
metadata:
  title: "Find available space"
---

# Find space for a meeting or event

Goal: shortlist rooms that fit the request and explain why each one fits.

## Steps

1. Pin down the requirements: number of participants, date and time, layout (theatre,
   classroom, boardroom, banquet), daylight, accessibility, city or venue. Ask at most one
   short follow-up question if the participant count is missing.
2. Search broadly: call `search` with the request in the user's own words, restricted to
   `entityTypes: ["room"]`. Then call `room_list` (optionally with `venueId`) to cover rooms
   that search missed.
3. Filter strictly on hard requirements: `maxCapacity` must be at least the participant count,
   `hasDaylight` must be true when daylight is required. Use `room_get` and `venue_get` for
   details such as floor, area and address.
4. Rank by fit: the smallest room that still fits comes first (a room for 200 is a poor fit for
   12 people). Show at most five options with capacity, area, daylight and venue.

## Availability

Okazi does not yet expose bookings or calendars to the assistant. Say clearly that the list is
based on room data only and that availability for the date must be checked before booking.
Never claim that a room is free.
