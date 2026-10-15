# 0033 – Binary export via signed download URL

- **Date:** 2026-10-15
- **Status:** Accepted

## Context
- ADR 0024 requires export as json, pdf and csv on all four surfaces (ADR 0003). pdf is binary and no pattern exists (issue #15, blocks #63).
- GraphQL and MCP responses are poor carriers of large binary payloads.

## Decision
- **Transport: a signed, time-limited download URL.** The operation returns `{ url, filename, mime, size }` on every surface, so parity holds and nothing binary passes through GraphQL or MCP.
- **REST file endpoint** serves the file (streamed). The URL is validated against the organization and expires after a short period.
- **Limit:** 10 MB per file.
- **PDF library:** `@react-pdf/renderer`, which fits our React code and shared tokens.
- json and csv use the same mechanism, so all formats behave alike.

## Consequences
- The parity test expects the `{ url, filename, mime, size }` output shape for export operations.
- The download endpoint is a new HTTP entry point and is wrapped in `withRequestLogging` (ADR 0014).
- Exports are generated on request. Storage of generated files is not needed beyond the signed URL's lifetime.
