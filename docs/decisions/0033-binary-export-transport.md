# 0033 – Binary export via signed download URL

- **Date:** 2026-10-15
- **Status:** Accepted
- **Related:** 0003, 0014, 0024

## Context
- Export as json, pdf and csv must exist on all four surfaces (ADR 0003, 0024). pdf is binary and no pattern existed.
- GraphQL and MCP responses are poor carriers of large binary payloads.

## Decision
1. Every export operation returns `{ url, filename, mime, size }` on every surface. The URL is signed, tied to the organization and short-lived.
2. A REST file endpoint streams the file. Limit 10 MB per file.
3. PDF is rendered with `@react-pdf/renderer`, which fits our React code and tokens.
4. json and csv use the same mechanism, so all formats behave alike.

## Rejected
- Inline binary in GraphQL or MCP responses: poor transport and breaks parity in practice.

## Consequences
- The parity test expects the `{ url, filename, mime, size }` shape for export operations.
- The download endpoint is a new HTTP entry point and is wrapped in `withRequestLogging`.
- Files are generated on request and not stored beyond the URL's lifetime.
