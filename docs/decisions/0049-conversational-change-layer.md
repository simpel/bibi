# 0049 – The conversational change layer: previews and change sets

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0007 (AI-first UX), 0048 (superseded by 0050), 0044, 0003, 0058
- **Spec:** `docs/specs/change-layer.md`

## Context
- Every change the assistant makes is a proposal the user confirms (ADR 0007).
- The approval card showed only the proposed input, with no before/after and nothing about what else the change touches.
- A request needing several commands became several cards that could be confirmed one by one, leaving a half-done change.

## Decision
1. Every proposal carries a preview computed by core, not written by the model. The handler runs in a transaction that is always rolled back, and recorded changes become before/after per record.
2. Operations may declare consequences with a severity. A warning needs an explicit tick before Confirm.
3. The proposal is previewed when created, so a command that would fail fails there. The signed token still binds the exact input.
4. A change set is one request, one card and one transaction, all or nothing (`changeSet.apply`), with steps able to reference earlier outputs.

## Rejected
- A model-written summary of the effect: it can differ from what runs.
- One card per command: allows a half-done change.

## Consequences
- The assistant can be trusted with larger requests because the effect is computed and shown.
- A preview runs the handler once more, so external effects must stay out of previewable handlers (ADR 0058).
