# 0026 – Configurable domain: implementation choices

- **Date:** 2026-10-14
- **Status:** Accepted
- **Builds on:** 0021, 0025
- **Spec:** `docs/specs/configurable-domain.md`

## Context
- ADR 0021 makes types, fields, lists and setups data. Building it raised questions it does not answer: how values are keyed, what happens to existing data on a change, and how permissions split.

## Decision
1. Field values are JSON on the row under a stable `key`, generated from the name, unique per type including archived fields and never changed.
2. A list choice is stored as the value's id, so a rename breaks nothing. A choice field has a list or its own options, never both; only list values count as tags.
3. Anything that would invalidate existing values (turning off a capability, changing a field's kind, narrowing options, archiving a linked target) is refused with `CONFLICT` while data exists. Changing a kind means a new field, moved values and an archived old one.
4. Capability data lives in ordinary columns on `Item`, valid only if the type has the capability.
5. Two permission resources: `item` and `configuration`.
6. MCP tools describe the organization's configuration per call, read as the caller.

## Rejected
- Keying values by field id or name: a rename would move or lose values, and REST, GraphQL and the AI would see opaque keys.
- Silent data loss on configuration change.

## Consequences
- The conflict check runs in memory per type, enough while catalogs have hundreds of rows.
- Admins must remove data before turning off a capability. That is intentional.
