# Okazi

Bokningssystem för verksamheter som säljer konferens med mat och dryck: upplevelsecenter, museer, konferensgårdar, herrgårdar och restauranger med privata rum (t.ex. World of Volvo).

Kärnflöde: förfrågan → option → offert → signering → bokning → programpunkter → deltagare & kost → köksorder → genomförande → faktura → Fortnox/Visma.

## Status

Förstudie avslutad och teknikstack beslutad (ADR 0002–0009). Monorepo-scaffold under uppbyggnad: infrastruktur, databas, core-operationer och första vertikala skiva (Anläggning och Rum) finns i planen men är inte klara.

## Kom igång

Kräver Node 22+, pnpm 10 och Docker.

```bash
docker compose up -d        # Postgres (pgvector) och Mailpit
pnpm install
pnpm db:migrate
pnpm dev
```

Övriga kommandon:

| Kommando | Syfte |
|---|---|
| `pnpm lint` | Biome-kontroll |
| `pnpm check:structure` | Filstorlek, funktionsstorlek, exporter, barrel-filer och feature-filer |
| `pnpm typecheck` | TypeScript för alla paket |
| `pnpm test` | Vitest och paritetstest |
| `pnpm gen entity <Name>` | Skapar en ny feature-mapp för en entitet |

### Miljövariabler

Filen `.env.example` har inte kunnat skapas ännu. Skapa `.env` i repots rot och kopiera in värdena manuellt.

| Variabel | Beskrivning |
|---|---|
| `DATABASE_URL` | Postgres-anslutning, t.ex. `postgresql://okazi:okazi@localhost:5432/okazi` |
| `BETTER_AUTH_SECRET` | Hemlighet för sessioner och tokens (minst 32 tecken) |
| `BETTER_AUTH_URL` | Publik bas-URL för autentisering, t.ex. `http://localhost:3000` |
| `SMTP_URL` | SMTP-anslutning för mejl, lokalt Mailpit på `smtp://localhost:1025` |
| `MAIL_FROM` | Avsändaradress för systemmejl |
| `AI_GATEWAY_API_KEY` | Nyckel till Vercel AI Gateway |
| `AI_DEFAULT_MODEL` | Standardmodell för assistenten, t.ex. en Claude-modell |
| `AI_EMBEDDING_MODEL` | Modell för inbäddningar i semantisk sökning (valet är ännu inte gjort) |
| `WEB_URL` | Bas-URL för webbappen, t.ex. `http://localhost:3000` |
| `MCP_URL` | Bas-URL för MCP-servern, t.ex. `http://localhost:3001` |

Miljövariabler läses endast via `@okazi/config`.

## Dokumentation

| Dokument | Innehåll |
|---|---|
| [docs/marknad/marknadsanalys.md](docs/marknad/marknadsanalys.md) | Multinet/Lega Online, marknadssegment, kommunmarknaden, Norden, strategi |
| [docs/marknad/konkurrenter-venue.md](docs/marknad/konkurrenter-venue.md) | Konkurrentkarta för konferens + F&B-segmentet, täckningsmatris, luckor |
| [docs/domanmodell.md](docs/domanmodell.md) | Entiteter, attribut, relationer och fasning (MVP / Fas 2 / Fas 3) |
| [docs/artefakter/domanmodell.html](docs/artefakter/domanmodell.html) | Interaktiv vy av domänmodell och konkurrentmatris |
| [docs/beslut/](docs/beslut/) | Beslutslogg (ADR) |
