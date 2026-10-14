# @okazi/api – kontext för Claude

REST-adaptern under `/api/v1`. Tunn: ingen affärslogik, allt går via core-operationer och `execute` (ADR 0003).

## Användning
- `createRestHandler({ operations, resolveContext, basePath = "/api/v1" })` → `(request: Request) => Promise<Response>`. Monteras i Next: `app/api/v1/[...path]/route.ts` exporterar `GET/POST/PATCH/DELETE` som anropar handlern.
- `resolveContext({ headers })` injiceras (riktig från `@okazi/auth`, tester använder `createExecuteContext`). Anropas först efter att en rutt matchat; `openapi.json` och `docs` kräver ingen inloggning.
- `GET /openapi.json` (OpenAPI 3.1, genererad) och `GET /docs` (Scalar via CDN).

## Rutter
- Deklareras per feature i `src/features/<entitet>/rest.ts` med `restRoute({ operation, method, path, successStatus?, operationId? })`; sökvägar med `{param}`. Registrera i `src/routes.ts`. Ny operation = ca 5 rader. `search` ligger i `src/search-rest.ts`.
- Indata = query + JSON-body + path-parametrar (path vinner), valideras av core. Query-värden typkonverteras utifrån operationens input-schema (siffror, booleans, arrayer).
- Flera rutter för samma operation (t.ex. `/venues/{venueId}/rooms`) kräver unikt `operationId`.
- Fel: `{ error: { code, message, issues } }`, status via `toHttpStatus`. Okänd rutt/metod → 404.
- Paginering: `limit` och `cursor` som i core (`nextCursor` i svaret).
- AI-datalager: `/conversations` (GET/POST), `/conversations/{id}` (GET/PATCH=rename/DELETE=archive), `/conversations/{conversationId}/messages` (GET/POST), `/skills` (GET/POST), `/skills/import` (POST), `/skills/{id}` (GET/PATCH/DELETE), `/skills/{id}/publish` (POST, 200), `/skills/{id}/share` (POST, 201), `/skills/{id}/export` (GET, JSON `{ markdown, filename }`).
- Test-resolvern tar även `x-test-user` (annan användare i samma org).

## OpenAPI
- Byggs i `src/openapi/` av rutt-metadata + Zod via `z.toJSONSchema` (datum → `date-time`). Säkerhetsscheman (API-nyckel `okz_…`, cookie, OAuth2) är bara beskrivande.

## Paritet
- `listRestRoutes()` / `listRestOperationNames()` används av paritetstestet: varje operation i registret ska ha en REST-rutt.

## Tester
- Vitest mot riktig Postgres, anropar handlern med Web `Request`. Test-resolver: header `x-test-org` (saknas → 401), `x-test-roles`.
