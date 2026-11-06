# 0045 – Soft-landing onboarding with the assistant

- **Date:** 2026-10-19
- **Status:** Superseded by 0061
- **Related:** 0007, 0044, 0021, 0043
- **Spec:** `docs/specs/onboarding.md`

The seven-step setup wizard of ADR 0044 was too detailed for a new user. This ADR replaced it with a short assistant chat with a live picture at `/onboarding`. Presets (conference estate, restaurant with private rooms, experience centre or museum, empty) were data in core, so domain words lived only there. The assistant ran a system skill of at most three questions, and saving was an approval audited as `actor=ai`. There was no non-AI fallback: without a model the user skipped to the app. ADR 0061 (the welcome flow) replaced it.
