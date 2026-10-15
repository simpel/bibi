# Okazi

Booking system for businesses that sell conferences with food and drink: experience centers, museums, conference estates, manor houses and restaurants with private rooms (e.g. World of Volvo).

Core flow: inquiry → option → quote → signing → booking → program items → participants & diets → kitchen order → delivery → invoice → Fortnox/Visma.

## Status

Feasibility study finished and tech stack decided (ADR 0002–0009). The monorepo has infrastructure, database, core operations (venues, items, conversations, skills, search), GraphQL/REST/MCP, the web app with an AI assistant (panel, ⌘K, approval cards) and a Skills section.

## Getting started

Requires Node 22+, pnpm 10 and Docker. Running locally from scratch:

```bash
docker compose up -d                          # Postgres (pgvector) and Mailpit
# Production: IMAGE_TAG=<sha> docker compose -f docker-compose.prod.yml up (see docker-compose.prod.yml header)
pnpm install
touch .env                                    # create .env in the repo root, see the table below
pnpm db:migrate                               # database migrations
pnpm --filter @okazi/core seed:skills         # system skills (the assistant's skills)
pnpm --filter @okazi/web provision:oauth      # creates the assistant's OAuth client, prints WEB_OAUTH_CLIENT_ID=...
# put WEB_OAUTH_CLIENT_ID=<value> and AI_GATEWAY_API_KEY=<key> in .env
pnpm dev                                      # web on :3000 and the MCP server on :3001
```

- Web: <http://localhost:3000> (create an account, create an organization, open the assistant with `⌘J` / `Ctrl+J`).
- Mailpit (sign-in emails, magic links and one-time codes): <http://localhost:8025>.
- MCP server: `http://localhost:3001/mcp` (see `apps/mcp/CLAUDE.md`).
- The assistant needs both `WEB_OAUTH_CLIENT_ID` (web and MCP read the same `.env`) and `AI_GATEWAY_API_KEY`. Without the key the rest of the app works, and semantic search uses a deterministic placeholder (outside production only). AI models (chat and embeddings) are selected via `/admin/ai-models` by a platform admin (see [ADR 0015](docs/decisions/0015-platform-admin.md)), not via env. Rerun `provision:oauth` if `WEB_URL` changes; the script is idempotent.

Other commands:

| Command | Purpose |
|---|---|
| `pnpm lint` | Biome check |
| `pnpm check:structure` | File size, function size, exports, barrel files and feature files |
| `pnpm typecheck` | TypeScript for all packages |
| `pnpm test` | Vitest and parity tests |
| `pnpm --filter @okazi/web test:e2e` | Playwright (requires built web and MCP, see `apps/web/CLAUDE.md`) |
| `pnpm gen entity <Name>` | Creates a new feature folder for an entity |

### Environment variables

Create `.env` in the repo root (there is no `.env.example` yet). The web app, the MCP server and the scripts read the same file.

| Variable | Description |
|---|---|
| `DATABASE_URL` | Postgres connection, e.g. `postgresql://okazi:okazi@localhost:5432/okazi` |
| `BETTER_AUTH_SECRET` | Secret for sessions and approval tokens (at least 32 characters) |
| `BETTER_AUTH_URL` | Public base URL for authentication, e.g. `http://localhost:3000` |
| `SMTP_URL` | SMTP connection for email, locally Mailpit at `smtp://localhost:1025` |
| `MAIL_FROM` | Sender address for system email |
| `AI_GATEWAY_API_KEY` | Key for Vercel AI Gateway (assistant and embeddings) |
| `WEB_URL` | Base URL of the web app, e.g. `http://localhost:3000` |
| `MCP_URL` | Base URL of the MCP server, e.g. `http://localhost:3001` |
| `PORT` | Listening port for the MCP server (default 3001) |
| `WEB_OAUTH_CLIENT_ID` | The web app's first-party client for the assistant (from `provision:oauth`). Read by the web app and the MCP server; only that client may act as the AI actor |
| `OKAZI_API_KEY` | API key for MCP over stdio (`okz_...`) |
| `NODE_ENV` | `production` disables dev fallbacks (placeholder embedding, E2E model) |
| `E2E_MOCK_MODEL` | E2E only: `1` makes the chat route use the scripted test model instead of a real LLM. Off by default and ignored when `NODE_ENV=production` |

Environment variables are read only via `@okazi/config`.

## Documentation

| Document | Contents |
|---|---|
| [docs/market/market-analysis.md](docs/market/market-analysis.md) | Multinet/Lega Online, market segments, the municipal market, the Nordics, strategy |
| [docs/market/venue-competitors.md](docs/market/venue-competitors.md) | Competitor map for the conference + F&B segment, coverage matrix, gaps |
| [docs/domain-model.md](docs/domain-model.md) | Entities, attributes, relations and phasing (MVP / Phase 2 / Phase 3) |
| [docs/artifacts/domain-model.html](docs/artifacts/domain-model.html) | Interactive view of the domain model and competitor matrix |
| [docs/decisions/](docs/decisions/) | Decision log (ADR) |
