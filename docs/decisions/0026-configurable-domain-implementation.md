# 0026 – Configurable domain: implementation choices

- **Date:** 2026-10-14
- **Status:** Accepted
- **Builds on:** 0021, 0025 (part 2)
- **Spec:** `docs/specs/configurable-domain.md`

## Context
- ADR 0021 decides that types, fields, vocabularies and setups are data and the code owns only capabilities. Building it (ADR 0025 part 2, replacing `Room` with `Item`) raised questions 0021 does not answer.

## Decision
- **Field values are JSON on the row under a stable `key`** (generated from the name, unique per type including archived fields, never changed). Rejected: keying by field id or name, because a rename would move or lose values and REST, GraphQL and the AI would see opaque keys.
- **A vocabulary choice is stored as the value's id**, so a rename breaks nothing. A choice field has a vocabulary or its own options, never both; only vocabulary values count as tags.
- **"Data exists → `CONFLICT`" applies to anything that would invalidate existing values** (turning off a capability, changing a field's kind, narrowing options, archiving what a link points to). It is computed in memory per type, which is enough while catalogs have hundreds of rows.
- **Capability data lives in ordinary columns** on `Item`, valid only if the type has the capability.
- **Two permission resources**: `item` (replacing `room`) and `configuration` (types, fields, vocabularies, setups).
- **MCP tools describe the organization's configuration per call**, read as the caller; without `configuration:read` the static description is used.

## Consequences
- `room.*`, the `Room` table and the `room` resource are gone; no data migration because there is no production data.
- A capability can only be turned off after its data is removed. This is intentional, preferred over silent data loss. Changing a field's kind means a new field, moved values and an archived old field.
