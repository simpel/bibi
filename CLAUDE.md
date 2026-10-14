# Okazi – kontext för Claude

## Produkt
- SaaS-bokningssystem för konferens + mat & dryck hos venues utan hotell-PMS: upplevelsecenter, museer, konferensgårdar, herrgårdar, restauranger med privata rum.
- Referenskund i åtanke: World of Volvo (Göteborg). Maten levereras av extern restaurangoperatör → köksorder måste kunna gå till partner över bolagsgräns.
- Huvudkonkurrent: Lega Online (Multinet Interactive AB). Se `docs/marknad/`.

## Differentierare (styr prioritering)
- Direktbokning med betalning (Swish/kort) för mindre möten, inte bara förfrågan.
- Deltagarlista med allergier per person kopplade till EU:s 14 allergener (plus separata kostpreferenser), sammanställt i köksorder.
- Versionerad köksorder till eget kök eller extern partner.
- Optioner med kö (1:a/2:a option) och automatiskt förfall.
- Svenska integrationer: Fortnox, Visma, Swish, BankID, Peppol/e-faktura.
- Publicerade priser och självregistrering.

## Domänmodell
- Källa: `docs/domanmodell.md`. Uppdatera den och `docs/artefakter/domanmodell.html` tillsammans.

## Konventioner
- Dokumentation på svenska.
- Filnamn är alltid på engelska (även ADR:er och docs). Innehållet kan vara svenskt.
- Beslut loggas som ADR i `docs/beslut/NNNN-titel.md`.

## Teknikstack
- Monorepo: pnpm workspaces + Turborepo, TypeScript (strict).
- Webb: Next.js (App Router), React.
- Data: Prisma mot Postgres med pgvector (Docker-image `pgvector/pgvector`).
- Auth: Better Auth med organization-plugin (multi-tenancy), API-nyckel-plugin (REST) och OAuth-plugin (MCP).
- API:er: GraphQL via Pothos (Prisma-plugin), REST `/api/v1` med OpenAPI genererad från operationer, MCP-server (`apps/mcp`).
- AI: Vercel AI SDK via AI Gateway, leverantörsoberoende, Claude som standard.
- UI: Tailwind v4 (CSS-first tokens), cva, shadcn-primitiver, Storybook för `packages/ui`.
- i18n: next-intl, svenska och engelska.
- Verktyg: Biome (lint + format), Vitest (enhet/tjänstelager mot riktig Postgres), Playwright (e2e).
- E-post: Resend (ut och in) bakom `MailProvider`, Mailpit i dev. Se `docs/beslut/0012-email-provider.md`.
- Drift: Docker (compose med Postgres och Mailpit, `--profile app` för web + mcp), GitHub Actions för CI.
- Beslut: `docs/beslut/0002-teknikstack-och-monorepo.md` m.fl.

## Arkitekturprinciper
- **Harmonisering och mönster först.** Sök efter befintliga mönster och återanvänd dem innan något nytt införs. Föreslå harmonisering hellre än ett nytt mönster. Extrahera gemensam kod vid den andra dubbletten, inte först vid den tredje.
- **1:1-paritet.** Varje kommando finns i web, GraphQL, REST och MCP. Varje entitet går att läsa via graph, REST och MCP. Ett paritetstest i CI verifierar detta. Se `docs/beslut/0003-paritetsarkitektur.md`.
- **Ny förmåga = ny core-operation först.** Operationen definieras en gång i `packages/core` (Zod in/ut, behörighet, handler). Adaptrarna exponerar den sedan i samma ändring.
- **AI-first.**
  - Assistenten använder appens egen MCP-server som inloggad användare. Den får ingen särskild väg in i tjänstelagret.
  - Mutationer kräver mänskligt godkännande. AI föreslår, användaren bekräftar. Audit loggar `actor=ai|user` och konversations-id.
  - Varje resultattyp har en generative UI-komponent i `@okazi/ui`.
  - Sökbara entiteter implementerar `Embeddable`.
  - Återanvändbart AI-beteende lever som skills (System / Organisation / Personlig), inte som ad hoc-prompter.
  - Se `docs/beslut/0007-ai-first-ux.md` och `docs/beslut/0008-semantisk-sokning-och-skills.md`.
- **Multi-tenant.** Allt är scopat på `organizationId`. Varje mutation loggas i `AuditLog`. Se `docs/beslut/0004-multi-tenancy.md` och `docs/beslut/0006-databaskonventioner.md`.

## Kodregler
- Max 150 rader per fil och max 40 rader per funktion. En idé per fil.
- Endast named exports. `default` används bara för Next.js page, layout och route.
- Inga barrel-filer utom paketets `src/index.ts`.
- Funktioner tar ETT typat objekt som parameter, t.ex. `fn({ a, b }: FnInput)`. Inga positionsparametrar.
- Strikt TypeScript. Ingen `any`.
- Zod vid alla gränser: HTTP, GraphQL-argument, MCP-verktygsinput, env och AI-output.
- Miljövariabler läses endast via `@okazi/config`.
- Fel är typade `AppError` och returneras som `Result`. Inga kastade strängar.
- Feature-mappar har fasta filnamn: `schema.ts`, `operations.ts`, `graphql.ts`, `rest.ts`, `mcp.ts` och `ui/`.
- Kod och entitetsnamn är på engelska. UI-text går via next-intl (sv + en).
- UI byggs endast från `@okazi/ui`. Varianter görs med cva. Tokens ligger i en fil.
- Verifieras med `pnpm check:structure`. Se `docs/beslut/0009-sprak-i-kod-och-ui.md`.

## Paketlayout
- `apps/web`: Next.js-appen (UI, server actions, `/api/chat`).
- `apps/mcp`: MCP-server, stdio och streamable HTTP.
- `packages/core`: operationer, Zod-scheman, behörighet och `AppError`/`Result`. Enda sanningen för logiken.
- `packages/db`: Prisma-schema, migrationer och org-scopad klient.
- `packages/auth`: Better Auth-konfiguration och delad sessions- och behörighetsupplösning.
- `packages/graphql`: Pothos-schema, genererat från core-operationer och entiteter.
- `packages/api`: REST `/api/v1` och OpenAPI.
- `packages/ui`: komponenter, tokens och Storybook.
- `packages/i18n`: meddelanden sv och en.
- `packages/ai`: AI SDK-uppsättning, MCP-klient, generative UI-registret och system-skills.
- `packages/config`: miljövariabler (typat och validerat) samt tsconfig- och Biome-gemensamt.

## Arbetssätt med subagenter
- Baslinje: Sonnet.
- Opus för arkitektur och säkerhet: auth, tenancy-scoping, paritetskärnan (`packages/core`), MCP-auth och godkännandeflödet.
- Haiku för mekaniskt arbete: boilerplate, i18n-strängar och dokumentsynk.
- Starta parallella subagenter per oberoende paket.
- Huvudagenten äger integrationen och paritetstestet. Subagenter får inte ändra varandras paket utan att huvudagenten har integrerat.

## Kommandon
- `docker compose up -d`: startar Postgres och Mailpit (mejl på http://localhost:8025).
- `pnpm install`: installerar beroenden.
- `pnpm db:migrate`: kör databasmigrationer.
- `pnpm --filter @okazi/core seed:skills`: seedar system-skills.
- `pnpm --filter @okazi/web provision:oauth`: skapar assistentens OAuth-klient och skriver ut `WEB_OAUTH_CLIENT_ID=...` (lägg i `.env`, läses av webb och MCP).
- `pnpm dev`: startar webben (:3000) och MCP-servern (:3001) via Turborepo.
- `pnpm lint`: Biome-kontroll.
- `pnpm check:structure`: kontrollerar filstorlek, funktionsstorlek, exporter, barrel-filer och feature-filer.
- `pnpm typecheck`: TypeScript för alla paket.
- `pnpm test`: Vitest och paritetstest.
- `pnpm --filter @okazi/web test:e2e`: Playwright med skriptad modell (`E2E_MOCK_MODEL`), se `apps/web/CLAUDE.md`.

## Öppna frågor
- Prismodell (per venue, per rum, per bokning) ej beslutad.
- Claude Design-export (tokens) för `packages/ui` ej levererad. Placeholder-tokens används tills dess.
- Produktionsmiljö och hosting ej beslutad. Självhostad Docker antas.
- Embedding-modell ej vald.
- Resends EU-region och DPA (GDPR) ej bekräftade.
