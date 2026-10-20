---
name: first-setup
description: "Interview a new organization in at most three questions and draft its first version: what it sells and how a request moves. Use on the first-setup page right after an organization is created, or when the user asks to start the setup over from the beginning."
allowed-tools: entityType_list pipelineSetup_presetDraft pipelineSetup_preview ask_question
metadata:
  title: "First setup"
---

# First setup

Goal: a believable first version for a brand-new organization, reached in a short, friendly chat.
It is a starting point, not the final configuration. The user changes details later by asking
the assistant, or in Settings and Pipeline. Nothing is saved in this skill.

## How to talk

- Plain, warm words in the user's language. Short sentences.
- Never mention states, holds, the grid, "bookable", drafts, presets, templates, JSON, tool names
  or ids. Say "what you sell" for item types and "how a request moves" for phases.
- Never show the draft itself. The page shows a picture of it next to the chat.
- Say once, early, that everything can be changed later by asking you, or in Settings.

## Steps

1. Greet in two sentences: welcome them, and say you will ask at most three quick questions to
   set up a first version they can change at any time.
2. Ask the questions with `ask_question`, one per call, each with clickable answers and
   `allowOther: true`. Your turn ends with each call; the answer arrives as the next message.
   Skip a question the user has already answered in their own words.
   1. "What kind of place do you run?" Answers: a conference venue or estate
      (`conference-estate`), a restaurant with private rooms (`restaurant`), an experience
      centre or museum (`experience-centre`), something else (`other`).
   2. "What do you sell?" with `multiple: true` (they tick all that apply). Answers: rooms
      (`rooms`), food and drink (`food`).
   3. "Do your customers usually get a quote before they book?" Answers: yes (`quote-first`),
      no, they book straight away (`book-directly`).
3. Pick the preset from question 1: `conference-estate`, `restaurant` or `experience-centre`. For
   "something else", pick the closest one from the user's words, or `empty` if none fits. Call
   `pipelineSetup_presetDraft` with that `key`. Its item types already include the
   organization's own; never remove those (they have an `entityTypeId`).
4. Adjust the draft by name, keeping everything else exactly as returned:
   - Rooms only (food and drink not ticked): remove the new item types that are not held in time (no `BOOKABLE` in
     `behaviours`), e.g. food and drink.
   - Food only (rooms not ticked): remove the new item types that are held in time (`BOOKABLE`).
   - Book directly: remove the phase whose `event` is `QUOTE_SENT`, and set `event` to null on
     the phase whose `event` is `QUOTE_ACCEPTED`.
   - Quote first, and no phase has `event` `QUOTE_SENT`: add a phase "Quote sent" (in the
     user's language) right before the first phase with `requiresAssignee`, with `event`
     `QUOTE_SENT` and color `#7c3aed`, and set `event` `QUOTE_ACCEPTED` on that next phase.
   - You may rename new item types and phases into the user's language or words.
   - Whenever you remove or rename an item type or a phase, remove or rename it in `cells` too.
     A cell may only name item types and phases that are in the draft.
5. Call `pipelineSetup_preview` with the whole adjusted draft. If `ready` is false, fix the
   problems with `severity` "error" (each names its phase, item type and state) and preview
   again. Never stop on a draft that is not ready; if you are stuck, go back to the draft from
   step 3 and apply fewer changes.
6. End with two or three sentences: what they sell and how a request moves, in plain words, that
   nothing is saved yet, and that they can ask for changes now or later in Settings.

## Tips

- The draft you end with, the last one `pipelineSetup_preview` reported as ready, is the one the
  page shows and the one that is saved later. Always send the whole draft to the preview.
- Never invent prices, capacities or people.
- If the user asks something unrelated, answer briefly and return to the next question.
