# 0045 – Soft-landing onboarding with the assistant

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0007 (AI-first UX), 0044 (line states and the phase grid), 0021 (configurable items), 0043 (ticket and phases), 0004 (multi-tenancy), 0015 (platform admin)

## Context
- ADR 0044 built the first setup as a seven-step wizard at `/onboarding/pipeline`: item types, states, phases, the grid, preview, activate. It is accurate and complete, and far too detailed for someone who has just created an organization. States, holds, "bookable" and the grid are concepts a new user has not met yet.
- Okazi is an AI-first app. The assistant is the way in, not an add-on (ADR 0007).
- The first setup is a marketing moment. Its job is to give a new organization a believable baseline so the board is not empty, not to produce the final configuration.

## Decision

### A short chat with a live picture
- A new organization's first setup is a conversation with the assistant at `/onboarding`: chat on the left, a plain picture of the first version on the right. Full screen, no sidebar or top bar, only the wordmark and "Skip for now".
- Creating an organization continues to `/onboarding` (an OAuth flow still resumes authorize first). Skip goes to the app.
- The result is a **baseline, not the final configuration**. Changing it later is done by asking the assistant, or in Settings and Pipeline. Nothing about this flow is a mode the organization stays in.

### Presets are data
- Presets live in core as template data (`templates/setup-presets`, exported as `@okazi/core/setup-presets`): conference estate, restaurant with private rooms, experience centre or museum, and empty. Each names its item types (and which are bookable) and a phase template. Domain words live only there (ADR 0021).
- `draftFromPreset({ key, existingTypes })` returns a `PipelineSetupDraft` by name: item types the organization already has are kept, the preset's missing ones are added, and states, phases and the grid come from the existing templates (ADR 0044).

### The assistant does the interview
- A system skill, "First setup", asks at most three questions (kind of place, rooms/food/both, quote first or not), chooses a preset, adjusts item types and phases, and calls `pipelineSetup.preview` until the draft is ready.
- The user never sees states, holds, the grid or the word "bookable". The preset sets them silently. The assistant uses the app's own MCP server as the signed-in user, with no special path into the service layer (ADR 0007).
- The assistant always ends with a draft that `pipelineSetup.preview` reports as ready. A new AI feature `onboarding` is added to `AI_FEATURES`; its model is chosen in `/admin/ai-models`.
- There is no non-AI fallback. If no model is selected, the feature returns `UNAVAILABLE` and the user can skip to the app.

### Saving is an approval
- The assistant proposes `pipelineSetup.activate` with the ready draft. The approval card is the Save button ("Create my first version"). It is audited with `actor=ai`, the conversation id and the approving user. On approval the user lands on `/pipeline`.
- If the organization already has phases, the card says in plain words what is archived (ADR 0044).

### What the panel shows
- "What you sell": a card per kind of item type, in plain words. "How a request moves": the phases in order. A note says it is a starting point and that nothing is saved yet.
- No states, holds, grid or counts of settings.

### UI components
- All UI is shadcn/ui and the shadcn AI Elements patterns in `packages/ui`, never hand-rolled and never another UI library: `Chat`, `Message`, `Prompt Input`, `Suggestion` for the thread; `Confirmation` for the approval card; `Card`, `Badge` and `Button Group` for the panel.
- Questions to the user use the shadcn `Questionnaire`. The answer is sent as the next chat message through `useChat`. It does not change data, so the chat composer exception in CLAUDE.md "Forms" applies: no FormData submit and no server action.
- The phase path in the panel uses React Flow (`@xyflow/react`), read-only, with `Card` nodes and edges (fit view, no editing, no pan or zoom), as the AI Elements guidance for canvas, node and edge suggests. This ADR approves the dependency. Item types stay plain `Card`s.
- Each new component gets a Storybook story.

### What is replaced
- The seven-step wizard UI of ADR 0044 and its redirect on canvas pages are removed. The operations `pipelineSetup.preview` and `pipelineSetup.activate`, the templates and the settings pages stay as they are.

## Consequences
- New capability: presets in core, `draftFromPreset` (exposed to the assistant as the query `pipelineSetup.presetDraft`), the "First setup" system skill (`seed:skills`), a question tool with a `Questionnaire` result component, the `onboarding` AI feature, the `/onboarding` route group, the panel and the approval step. No new data model and no migration.
- `seed:demo` is unchanged. `--skip-pipeline` stays as the empty starting state; only wording in `docs/demo-seed.md` and the `checkDemoSetupNeed` comments changes.
- Everything is reachable later by the assistant or Settings, so the onboarding can stay small. A new user cannot get stuck in a configuration they do not understand.
- It depends on a configured AI model in production. That is acceptable because Okazi is AI-first and the model is a platform setting (ADR 0015).

## Out of scope for now
- A guided tour of the board after the onboarding, built on what the user just saw.
- An example ticket so the board is not empty.
- Editing items directly in the panel, and more presets.
