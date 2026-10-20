# 0045 – Soft-landing onboarding with the assistant

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0007 (AI-first UX), 0044 (line states and the phase grid), 0021 (configurable items), 0043 (ticket and phases), 0004 (multi-tenancy), 0015 (superadmin)
- **Spec:** `docs/specs/onboarding.md`

## Context
- ADR 0044 built the first setup as a seven-step wizard: accurate and complete, and far too detailed for someone who has just created an organization. States, holds, "bookable" and the grid are concepts a new user has not met.
- Okazi is AI-first; the assistant is the way in, not an add-on (ADR 0007).
- The first setup is a marketing moment. Its job is a believable baseline so the board is not empty, not the final configuration.

## Decision
- **The first setup is a short chat with a live picture** at `/onboarding`, with "Skip for now". The result is a baseline; later changes go through the assistant or Settings.
- **Presets are data** in core (conference estate, restaurant with private rooms, experience centre or museum, empty). Domain words live only there (ADR 0021).
- **The assistant does the interview** (a system skill, at most three questions) and the user never sees states, holds or the grid; the preset sets them silently. The assistant uses the app's own MCP server as the user.
- **Saving is an approval** (`pipelineSetup.activate`), audited as `actor=ai`.
- **There is no non-AI fallback.** Without a configured model the user skips to the app. Rejected: keeping the wizard as a fallback.
- **The wizard UI of ADR 0044 is removed**; its operations, templates and settings pages stay.

## Consequences
- New: presets, `pipelineSetup.presetDraft`, the "First setup" skill, a `Questionnaire` result component, the `onboarding` AI feature, the `/onboarding` route group and the panel. No new data model and no migration.
- Everything stays reachable later by the assistant or Settings, so a new user cannot get stuck in a configuration they do not understand.
- It depends on a configured AI model in production, acceptable because the model is a platform setting (ADR 0015).
- Dependency approved: React Flow (`@xyflow/react`) for the read-only phase path.

## Out of scope for now
- A guided tour of the board, an example ticket, editing items in the panel, more presets.
