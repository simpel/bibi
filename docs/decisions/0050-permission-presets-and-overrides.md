# 0050 – Permission presets and per-user overrides

- **Date:** 2026-10-19
- **Status:** Accepted, feature scope amended by 0071 (view read models)
- **Related:** 0034, 0048 (superseded), 0005 (API keys, amended), 0015, 0003, 0007
- **Spec:** `docs/specs/permissions.md`

## Context
- One fixed role per member (ADR 0034, 0048) was too coarse. One member may also edit items, and one manager must not see payments.
- Per-resource levels did not match how staff think and could not hide a part of the app.
- API keys were tied to their creator and capped by that user's role, so a key died when the person left.

## Decision
1. A permission is `<feature>:<action>`, with actions `read`, `write` and `delete` (archive).
2. `member`, `manager` and `admin` are presets, constant permission sets in code. Every member and API key has exactly one preset.
3. Admins fine-tune with `allow` or `deny` overrides, stored as differences only, so a preset change reaches everyone on it. Effective = preset + allow − deny.
4. Admin-only lock: every action but `read` on `member`, `apiKey` and `paymentAccount` comes only from the `admin` preset, so no toggle can make someone an admin.
5. Feature scope: an operation returns only its own feature's data. Another feature's record is an id resolved through its owner, and denying `read` hides a feature everywhere. Shared vocabulary stays visible.
6. API keys belong to the organization, with their own preset and overrides. Only admins manage them, and a key or the AI actor never creates keys.

## Rejected
- Per-resource levels: wrong mental model, cannot hide features.
- Keys owned by users: they die with the user.

## Consequences
- Every core operation's `permission` is `feature:action`.
- Auth resolves preset and overrides on every request, so changes apply at once.
- The assistant's tools and Access section follow effective permissions.
- The superadmin platform role is unchanged (ADR 0015).
