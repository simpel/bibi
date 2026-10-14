# 0015 – Plattformsadmin

- **Datum:** 2026-10-14
- **Status:** Accepterat

## Kontext
- Okazi behöver en vy för oss som driver produkten: systemloggen (ADR 0014) och val av AI-modell per AI-funktion.
- Det finns bara organisationsroller (ADR 0004). En org-admin är kund och får aldrig se andra organisationers data.
- Loggar och modellval är plattformsdata, inte tenantdata. De har inget `organizationId` att scopa på.
- Systemloggen gick bara till stdout. Ingen loggmottagare är vald (ADR 0013).

## Beslut
- **Plattformsroll via Better Auth admin-plugin.** `user.role = "admin"` gör någon till plattformsadmin. Pluginets alla HTTP-endpoints är avstängda (`disabledPaths`): ingen kan befordra, förfalska eller stänga av användare via webben. Roller sätts med `pnpm --filter @okazi/auth grant-admin <email> [--revoke]`, som skriver en `AuditLog`-rad.
- **`resolvePlatformContext`** i `@okazi/auth` är enda vägen in. Endast sessionscookie: API-nycklar och OAuth-token (och därmed AI-assistenten) nekas. Rollen läses live från databasen vid varje anrop. Avstängda användare och impersonerade sessioner nekas.
- **Plattformsscope i core** (`packages/core/src/platform/`): `definePlatformOperation` och `executePlatform` med samma kedja som `execute`: Zod in, behörighet, handler, Zod ut, audit och logg. Handlers ser bara plattformstabellerna (`PlatformDb`). Kommandon auditeras med `organizationId = PLATFORM_SCOPE` (`__platform__`), som `scopedDb` vägrar.
- **Undantag från 1:1-paritet (ADR 0003).** Plattformsoperationerna registreras inte i org-registret och exponeras bara i webben (`/admin`). GraphQL, REST och MCP ser dem aldrig. Skäl: data över alla organisationer får inte nås med API-nycklar eller av AI:n. Undantaget gäller bara `platform/`.
- **Systemloggen sparas i Postgres** (`SystemLog`) utöver stdout. En pino-sink skriver i batchar (var 2:a sekund eller 200 rader), har en övre buffertgräns och rensar rader äldre än `SYSTEM_LOG_RETENTION_DAYS` (standard 30) en gång i timmen. Indexerade kolumner (tid, nivå, event, requestId, org, användare, operation) plus hela raden som JSON.
- **AI-modell per funktion.** Registret `AI_FEATURES` (`assistant.chat`, `search.embedding`). `AiSetting` håller adminens val. **Det finns inga standardmodeller och inga modell-env:er:** en funktion utan val svarar `UNAVAILABLE` (ny felkod, HTTP 503) och loggar `ai.modelNotConfigured` på error-nivå vid varje försök. `resolveAiModel` läser valet vid körning (cache 30 s per process). Modellistan hämtas från Vercel AI Gateway (`GET /v1/models`, cache 10 min). Bara **möjliga** modeller visas och accepteras, enligt `AI_FEATURES[].requires`:
  - chatten kräver taggen `tool-use`;
  - embeddings måste ge 1536 dimensioner (pgvector-kolumnen). Katalogen anger inte dimensioner, så varje kandidat provas med ett litet embed-anrop (cache: godkänt 24 h, underkänt 10 min).
  - Batch-varianter och utfasade modeller tas alltid bort.
  - Samma lista används både i UI:t och vid validering i `aiFeature.update`. Priser (USD per 1M tokens) visas per modell.
- **Webben:** `/admin` med shadcn-sidomeny. Andra än plattformsadmins får 404. Loggen visas i en TanStack-tabell med serverpaginering. Filter och vald rad ligger i URL:en, så länkar går att dela. Ett klick på en rad visar alla fält, rå JSON och "visa hela requesten". Modellsidan är en TanStack-tabell med en rad per AI-funktion och ett shadcn-formulär (select) per rad, som sparar direkt med toasts.

## Konsekvenser
- Byte av embedding-modell kräver omindexering (`pnpm --filter @okazi/ai reindex`). UI:t kräver bekräftelse. Sökningen filtrerar inte på modell, så resultaten är missvisande tills omindexeringen är klar.
- En ny miljö har ingen fungerande AI förrän en plattformsadmin valt modeller. Det är avsiktligt: modellval är ett produktbeslut och ska synas och auditeras, inte gömmas i env.
- Ett val kan inte tas bort, bara bytas (ingen "återställ", eftersom det inte finns något att återställa till).
- Fel från gatewayen under en chattström (t.ex. en modell som tagits bort) loggas som `ai.streamFailed`.
- `SystemLog` växer med trafiken. Retention styrs med env. Ska ersättas eller kompletteras med en extern mottagare när den väljs (ADR 0013).
- Första plattformsadmin skapas av drift med CLI:t. Det finns ännu inget UI för att hantera admins.
