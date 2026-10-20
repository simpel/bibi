# 0050 – Permission presets and per-user overrides

- **Date:** 2026-10-19
- **Status:** Accepted
- **Related:** 0034 (fixed access roles, superseded in part), 0048 (access levels, superseded), 0005 (API keys, amended), 0015 (superadmin), 0003 (parity), 0007 (AI-first UX)
- **Spec:** `docs/specs/permissions.md`

## Context
- ADR 0034 and 0048 gave each member one fixed role and nothing else. Real venues need finer control: one member may also edit items, one manager must not see payments.
- Permissions were per resource with `read < write < admin`, which does not match how staff think ("can Tina handle quotes?") and cannot hide a part of the app.
- API keys were tied to the user who created them and capped by that user's role, so a key died when that person left.

## Decision
- **A permission is `<feature>:<action>`**, with features the parts of the app staff recognise and actions `read`, `write`, `delete` (archive). Rejected: keeping resources with levels.
- **`member`, `manager` and `admin` become presets**: constant permission sets in code. Every member and API key has exactly one preset.
- **Admins fine-tune with overrides** (`allow` or `deny` per permission), stored as differences only so a preset change reaches everyone on it. Effective = preset + allow − deny.
- **Admin-only lock**: every action but `read` on `member`, `apiKey` and `paymentAccount` comes only from the `admin` preset, so one toggle can never make someone an admin.
- **Feature scope**: an operation returns only data of its own feature; another feature's record is an id resolved through its owner. Denying `read` hides a feature everywhere. If one feature needs another's data in its output, the scope is wrong. Shared vocabulary (types, phases, lists, colleagues' names) is always visible.
- **API keys belong to the organization**, with their own preset and overrides; they survive their creator leaving. Only admins manage them; a key and the AI actor never create keys.
- The superadmin platform role is unchanged (ADR 0015).

## Consequences
- Every core operation's `permission` is `feature:action`; `RESOURCES` becomes `FEATURES`.
- `packages/auth` resolves preset + overrides on every request (one extra indexed query), so changes apply at once.
- The assistant's tools and Access section follow effective permissions instead of the role.

## Addenda
- 2026-10-20: owners of the single-source-of-truth entity types (`ENTITY_FEATURE`) and snapshot `read` checks are in the spec (ADR 0051–0057).
- 2026-10-20: the `manager` preset gains `item:write` so managers maintain demands, setup times and working hours without an override (ADR 0059).
