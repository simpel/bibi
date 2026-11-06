# 0037 – Public documentation at /docs

- **Date:** 2026-10-17
- **Status:** Accepted
- **Related:** 0003, 0009

## Context
- Venues sign up without sales, so they need to read how Bibi works. Integrators need to know how to authenticate and call REST, GraphQL and MCP.
- Hand-written endpoint lists drift. The parity architecture (ADR 0003) already gives one list of operations with schemas, permissions and approval flags.

## Decision
1. Public docs live in the web app under `/[locale]/docs`, with no session read. Sections: Guide for staff, Developers for integrators, Reference.
2. Prose lives in next-intl messages in sv and en, rendered by the safe markdown view.
3. The REST reference is the existing generated Scalar page.
4. The MCP reference is generated from core operations and never written by hand.

## Rejected
- Hand-written endpoint lists: they drift.
- Describing MCP tools as fake OpenAPI routes in Scalar: try-it-out would fail. No hosted Scalar equivalent exists for MCP.

## Consequences
- Publishing the MCP tool catalogue is deliberate. It shows which operations and permissions exist but no data.
- A new operation appears in both references without a docs change. Prose pages still need manual updates.
- The MCP reference mirrors the MCP server's naming rule instead of importing it, so the two must change together.
