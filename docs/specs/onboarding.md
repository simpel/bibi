# First setup: onboarding with the assistant

Current behaviour. Why: ADR 0045 (replaces the wizard of ADR 0044).

## Flow
- A new organization's first setup is a conversation at `/onboarding` (route group `(onboarding)`): chat on the left, a plain picture of the first version on the right. Full screen, no sidebar or top bar, only the wordmark and "Skip for now". Creating an organization continues here (an OAuth flow still resumes authorize first). Skip goes to the app.
- The result is a baseline, not the final configuration. Changes later go through the assistant or Settings and Pipeline.
- The system skill "First setup" (`packages/core/src/skills/system/first-setup.md`, seeded by `seed:skills`) asks at most three questions (kind of place, rooms/food/both, quote first or not), chooses a preset, adjusts item types and phases and calls `pipelineSetup.preview` until the draft is ready. The user never sees states, holds, the grid or the word "bookable".
- Saving is an approval: the assistant proposes `pipelineSetup.activate` with the ready draft. The approval card is the Save button ("Create my first version"), audited with `actor=ai`, the conversation id and the approving user. On approval the user lands on `/pipeline`. If the organization already has phases, the card says in plain words what is archived.
- There is no non-AI fallback. The AI feature `onboarding` (`AI_FEATURES`) has its model chosen in `/admin/ai-models`; without one it returns `UNAVAILABLE` and the user can skip.

## Presets
- Template data in core (`templates/setup-presets`, exported as `@okazi/core/setup-presets`): conference estate, restaurant with private rooms, experience centre or museum, and empty. Each names its item types (and which are bookable) and a phase template. Domain words live only there.
- `draftFromPreset({ key, existingTypes })` (exposed as the query `pipelineSetup.presetDraft`) returns a `PipelineSetupDraft`: types the organization already has are kept, missing ones are added, and states, phases and the grid come from the existing templates.

## The panel
- "What you sell": a card per kind of item type in plain words. "How a request moves": the phases in order. A note says it is a starting point and nothing is saved yet. No states, holds, grid or counts of settings. The chat shows no draft cards; the panel is the only picture.
- Pointing at the draft: each item-type card and phase node is a button (click, or Tab then Enter/Space) with a selected outline that opens a comment box anchored to it. One element is selected at a time; Escape or Cancel deselects. Sending posts the next chat message through the shared `useChat` with the element named (templates in i18n), blocked while the assistant works. The panel changes no data itself. `SetupPanel` takes an optional `selection`; without it the panel is read-only.
- Questions use the shadcn `Questionnaire` (radio for one answer, checkboxes for several); the answer is sent as the next chat message.
- UI is shadcn and the shadcn AI Elements (`Chat`, `Message`, `Prompt Input`, `Suggestion`, `Confirmation`, `Card`, `Badge`, `Button Group`) in `packages/ui`. The phase path uses React Flow (`@xyflow/react`), read-only, with `Card` nodes and edges (fit view, no pan or zoom). Each new component gets a Storybook story.
- None of this changes data, so the chat composer exception for forms applies (no `FormData` submit, no server action).

## Not built
- A guided tour of the board after onboarding, an example ticket, editing items in the panel, more presets.
