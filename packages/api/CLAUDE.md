# @bibi/api – context for Claude

The REST adapter under `/api/v1`. Thin: no business logic, everything goes through core operations and `execute` (ADR 0003).

## Usage
- `createRestHandler({ operations, resolveContext, basePath = "/api/v1" })` → `(request: Request) => Promise<Response>`. Mounted in Next: `app/api/v1/[...path]/route.ts` exports `GET/POST/PATCH/DELETE` that call the handler.
- `resolveContext({ headers })` is injected (the real one from `@bibi/auth`, tests use `createExecuteContext`). Called only after a route has matched; `openapi.json` and `docs` need no sign-in.
- `GET /openapi.json` (OpenAPI 3.1, generated) and `GET /docs` (Scalar via CDN).

## Routes
- Declared per feature in `src/features/<entity>/rest.ts` with `restRoute({ operation, method, path, successStatus?, operationId? })`; paths with `{param}`. Register in `src/routes.ts`. A new operation = about 5 lines. `search` is in `src/search-rest.ts`.
- Input = query + JSON body + path parameters (path wins), validated by core. Query values are type-converted from the operation's input schema (numbers, booleans, arrays).
- Multiple routes for the same operation (e.g. `/venues/{venueId}/items`) require a unique `operationId`.
- `DELETE` = archive.
- Errors: `{ error: { code, message, issues } }`, status via `toHttpStatus`. Unknown route/method → 404.
- Pagination: `limit` and `cursor` as in core (`nextCursor` in the response).
- The test resolver also takes `x-test-user` (another user in the same org).

## OpenAPI
- Built in `src/openapi/` from route metadata + Zod via `z.toJSONSchema` (dates → `date-time`). The security schemes (API key `bib_…`, cookie, OAuth2) are descriptive only.

## Parity
- `listRestRoutes()` / `listRestOperationNames()` are used by the parity test: every operation in the registry must have a REST route.

## Tests
- Vitest against a real Postgres, calls the handler with a Web `Request`. Test resolver: header `x-test-org` (missing → 401), `x-test-roles`.
