---
name: propose-configuration
description: "Propose and set up a base configuration (types, fields, lists, setups) for an organization from a short description of its business. Use when the user describes what they run, e.g. 'we are a manor house with a restaurant', or asks to get started or set up the system."
allowed-tools: entityType_list entityType_get entityType_create fieldDefinition_list fieldDefinition_create vocabulary_list vocabulary_get vocabulary_create vocabulary_importTemplate setup_list setup_create configuration_importTemplate
metadata:
  title: "Propose an organization configuration"
---

# Propose an organization configuration

Goal: turn a short description of the business into a base configuration the user approves.
The organization defines its own types, fields, lists and setups as data. Never assume domain
words: use the user's own vocabulary for every name.

## Steps

1. Read what exists first: `entityType_list`, `vocabulary_list` and `setup_list`
   (`fieldDefinition_list` per type when needed). Never propose something that already exists.
   Offer to extend an existing configuration instead of duplicating it.
2. Ask at most two short questions if the description is too thin (what is sold or booked,
   what must be tracked per ticket). Otherwise go straight to a proposal.
3. Present the whole proposal as one short plan before creating anything:
   - Lists (with values), e.g. needs counted against a list such as allergens.
   - Setups (ways a space can be arranged) with `changeoverMinutes`.
   - Types with a `base` and, for ITEM types, the behaviours that fit: PRICED, COMPOSABLE,
     CHOICES (needs COMPOSABLE), BOOKABLE, SETUPS (needs BOOKABLE).
   - Fields per type with a kind: TEXT, NUMBER, BOOLEAN, DATE, CHOICE, MULTI_CHOICE, LINK. Choice
     fields use a list (`vocabularyId`) or inline `options`. A LINK field points to records of
     another type (`linkTypeId`: an item, customer, contact or ticket type), so create the
     target type first.
4. Prefer templates when they fit instead of creating item by item:
   - `configuration_importTemplate` with `conference-venue` for lists, setups and types of a
     conference venue.
   - `vocabulary_importTemplate` with `eu-14-allergens` for the EU's 14 allergens.
   Templates are idempotent and ordinary editable data. Tell the user what the template adds.
5. Create the rest in dependency order: lists (`vocabulary_create`), setups (`setup_create`),
   types (`entityType_create`), then fields (`fieldDefinition_create`) using the ids returned
   by earlier steps. Every command needs the user's approval: wait for the result before
   the next one, and one at a time so each can be approved or rejected.
6. Finish with a short summary of what was created and what was skipped, and point out what
   the user can tune in Settings (statuses and roles are configured there).

## Tips

- Never invent prices, capacities or numbers. Leave them empty.
- Never store personal data about guests. Needs are counts against lists.
- If the user rejects a proposal, adjust the plan instead of retrying the same call.
- Swedish input is common. Name things in the language the user uses.
