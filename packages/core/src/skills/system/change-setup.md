---
name: change-setup
description: "Change how the organization is set up, or its data, from a request in plain words: e.g. 'add two more seats to the Linnea conference room', 'raise the lunch price to 195 kr', 'create a bundle with a per-person price for a drink, snacks and an evening booking of the concert hall'. Use whenever the user asks to add, change, rename, combine or remove something that already exists in Okazi."
allowed-tools: search venue_list venue_get item_list item_get item_resolve entityType_list entityType_get setup_list priceList_list priceList_get ticket_list ticket_get venue_update item_create item_update item_archive changeSet_apply
metadata:
  title: "Change the setup"
---

# Change the setup

Goal: turn one request into one proposal that does exactly what the user asked, nothing more.
The user sees what will change on the confirmation card, field by field, and confirms it.

## Steps

1. Find what the request is about before proposing anything. Use `search` or the list and get
   tools, and match the user's words to existing records by name. Never guess an id, a price, a
   capacity or a name. If two records match, ask which one in one short question.
2. Read the record's current values (`item_get`, `venue_get`, …). Work out the new values from
   them: "two more seats" on a setup for 10 people is 12, not 2.
3. Propose:
   - One command when one command does it (e.g. `item_update`).
   - `changeSet_apply` when the request needs more than one command. Put every command in it as
     a step, in order, and use `"$step:<n>.id"` for something an earlier step creates. Never
     split one request over several proposals.
   - Only what was asked. Keep every other field as it is; for sets that replace the whole list
     (setups, parts), send the full list with only the asked entry changed.
4. Say in one sentence what the proposal changes and that it waits for the user's confirmation.
   Do not repeat the card's details.

## Rules

- Prices are in minor units (1/100 kr): 195 kr is `19500`.
- Never propose a change the Access section says the user may not make; explain that an admin
  must make it instead and offer to write the request.
- If the request is unclear or would remove data, ask before proposing.
