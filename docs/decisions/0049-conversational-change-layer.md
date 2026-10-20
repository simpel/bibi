# 0049 – The conversational change layer: previews and change sets

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0007 (AI-first UX), 0048 (superseded by 0050), 0044 (pipeline setup batch), 0003 (parity)
- **Spec:** `docs/specs/change-layer.md`

## Context
- Okazi is a fixed system with a conversation on top. Every change is a proposal the user confirms (ADR 0007).
- Comparable products show the real effect rather than a summary, render it from the system rather than the model, keep the preview free of side effects, and gate changes but not reads.
- The approval card showed the proposed input only, with no before/after and nothing about what else the change touches. A request needing several commands became several cards that could be confirmed one by one, leaving a half-done change.

## Decision
- **Every proposal carries a preview computed by core**, not described by the model: the command's handler runs in a transaction that is always rolled back, and the changes it records become before/after per record. Rejected: a model-written summary.
- **Operations may declare consequences** (what the change affects beyond its own fields) with a severity. A warning needs an explicit tick before Confirm.
- **The proposal is previewed when it is created**, so a command that would fail fails there and the user is never asked to confirm something that cannot run. The signed token still binds the exact input.
- **Change sets**: one request, one card, one transaction, all or nothing (`changeSet.apply`), with steps able to reference earlier steps' outputs. Rejected: one card per command.

## Consequences
- The assistant can be trusted with larger requests: what will happen is computed and shown.
- A preview runs the handler once more before the change. External effects must stay out of previewable handlers, which is already the rule (ADR 0058).
