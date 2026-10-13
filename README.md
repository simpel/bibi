# Okazi

Bokningssystem för verksamheter som säljer konferens med mat och dryck: upplevelsecenter, museer, konferensgårdar, herrgårdar och restauranger med privata rum (t.ex. World of Volvo).

Kärnflöde: förfrågan → option → offert → signering → bokning → programpunkter → deltagare & kost → köksorder → genomförande → faktura → Fortnox/Visma.

## Status

Förstudie avslutad och teknikstack beslutad (ADR 0002–0009). Monorepot har infrastruktur, databas, core-operationer (Anläggning, Rum, konversationer, skills, sök), GraphQL/REST/MCP, webben med AI-assistent (panel, ⌘K, godkännandekort) och en Färdigheter-sektion.

## Kom igång

Kräver Node 22+, pnpm 10 och Docker. Lokal körning från noll:

```bash
docker compose up -d                          # Postgres (pgvector) och Mailpit
pnpm install
touch .env                                    # skapa .env i repots rot, se tabellen nedan
pnpm db:migrate                               # databasmigrationer
pnpm --filter @okazi/core seed:skills         # system-skills (assistentens färdigheter)
pnpm --filter @okazi/web provision:oauth      # skapar assistentens OAuth-klient, skriver ut WEB_OAUTH_CLIENT_ID=...
# lägg WEB_OAUTH_CLIENT_ID=<värdet> och AI_GATEWAY_API_KEY=<nyckel> i .env
pnpm dev                                      # webben på :3000 och MCP-servern på :3001
```

- Webben: <http://localhost:3000> (skapa konto, skapa organisation, öppna assistenten med `⌘J` / `Ctrl+J`).
- Mailpit (inloggningsmejl, magic link och engångskoder): <http://localhost:8025>.
- MCP-servern: `http://localhost:3001/mcp` (se `apps/mcp/CLAUDE.md`).
- Assistenten behöver både `WEB_OAUTH_CLIENT_ID` (webb och MCP läser samma `.env`) och `AI_GATEWAY_API_KEY`. Utan nyckeln fungerar resten av appen, och semantisk sökning använder en deterministisk platshållare (bara utanför produktion). Kör om `provision:oauth` om `WEB_URL` ändras; skriptet är idempotent.

Övriga kommandon:

| Kommando | Syfte |
|---|---|
| `pnpm lint` | Biome-kontroll |
| `pnpm check:structure` | Filstorlek, funktionsstorlek, exporter, barrel-filer och feature-filer |
| `pnpm typecheck` | TypeScript för alla paket |
| `pnpm test` | Vitest och paritetstest |
| `pnpm --filter @okazi/web test:e2e` | Playwright (kräver byggd webb och MCP, se `apps/web/CLAUDE.md`) |
| `pnpm gen entity <Name>` | Skapar en ny feature-mapp för en entitet |

### Miljövariabler

Skapa `.env` i repots rot (ingen `.env.example` finns ännu). Webben, MCP-servern och skripten läser samma fil.

| Variabel | Beskrivning |
|---|---|
| `DATABASE_URL` | Postgres-anslutning, t.ex. `postgresql://okazi:okazi@localhost:5432/okazi` |
| `BETTER_AUTH_SECRET` | Hemlighet för sessioner och godkännandetoken (minst 32 tecken) |
| `BETTER_AUTH_URL` | Publik bas-URL för autentisering, t.ex. `http://localhost:3000` |
| `SMTP_URL` | SMTP-anslutning för mejl, lokalt Mailpit på `smtp://localhost:1025` |
| `MAIL_FROM` | Avsändaradress för systemmejl |
| `AI_GATEWAY_API_KEY` | Nyckel till Vercel AI Gateway (assistent och inbäddningar) |
| `AI_DEFAULT_MODEL` | Modell för assistenten, standard `anthropic/claude-sonnet-5-5` |
| `AI_EMBEDDING_MODEL` | Modell för inbäddningar i semantisk sökning (valet är ännu inte gjort) |
| `WEB_URL` | Bas-URL för webbappen, t.ex. `http://localhost:3000` |
| `MCP_URL` | Bas-URL för MCP-servern, t.ex. `http://localhost:3001` |
| `PORT` | Lyssningsport för MCP-servern (standard 3001) |
| `WEB_OAUTH_CLIENT_ID` | Webbens förstapartsklient för assistenten (från `provision:oauth`). Läses av webben och MCP-servern; bara den klienten får agera som AI-aktör |
| `OKAZI_API_KEY` | API-nyckel för MCP över stdio (`okz_...`) |
| `NODE_ENV` | `production` stänger av dev-fallbacks (platshållar-inbäddning, E2E-modell) |
| `E2E_MOCK_MODEL` | Endast E2E: `1` låter chattrutten använda den skriptade testmodellen i stället för en riktig LLM. Av som standard och ignoreras när `NODE_ENV=production` |

Miljövariabler läses endast via `@okazi/config`.

## Dokumentation

| Dokument | Innehåll |
|---|---|
| [docs/marknad/marknadsanalys.md](docs/marknad/marknadsanalys.md) | Multinet/Lega Online, marknadssegment, kommunmarknaden, Norden, strategi |
| [docs/marknad/konkurrenter-venue.md](docs/marknad/konkurrenter-venue.md) | Konkurrentkarta för konferens + F&B-segmentet, täckningsmatris, luckor |
| [docs/domanmodell.md](docs/domanmodell.md) | Entiteter, attribut, relationer och fasning (MVP / Fas 2 / Fas 3) |
| [docs/artefakter/domanmodell.html](docs/artefakter/domanmodell.html) | Interaktiv vy av domänmodell och konkurrentmatris |
| [docs/beslut/](docs/beslut/) | Beslutslogg (ADR) |
