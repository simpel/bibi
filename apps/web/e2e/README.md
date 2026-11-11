# E2E (Playwright)

Run with a scripted model (`E2E_MOCK_MODEL=1`), never a paid AI call.

## Run locally
- Chromium is preinstalled at `/opt/pw-browsers/chromium`; never run `playwright install`.
- Sign-up and sign-in are magic link only: `e2e/mailbox.ts` reads the link from Mailpit (`MAILPIT_URL`, default `http://localhost:8025`), so Mailpit must run (`docker compose up -d mailpit`).
- Build `pnpm --filter @bibi/web build` (it serves MCP too, ADR 0104).
- Set `DATABASE_URL`, `BETTER_AUTH_SECRET` (>= 32 characters), `BETTER_AUTH_URL=http://localhost:3330` and `WEB_OAUTH_CLIENT_ID`, then run `pnpm --filter @bibi/web test:e2e`.
- `playwright.config.ts` starts the web app (`pnpm start`, :3330, MCP at `/mcp`) with `E2E_MOCK_MODEL=1` and `NODE_ENV=test` (`next start` otherwise sets `production`, where the flag is ignored). A server that is already running is reused.
- The port comes from `WEB_URL` in the root `.env` (default 3330). Worktrees from `pnpm wt:new` get their own ports and database via `tools/worktree/setup.sh`; `dev` and `start` read `WEB_PORT`.
- `E2E_SCREENSHOTS_DIR=<dir>` enables `screenshots.spec.ts` (light/dark, desktop/mobile).

## CI (`e2e` job in `.github/workflows/ci.yml`)
- Postgres and Mailpit services, `db:migrate`, `seed:skills`, `provision:oauth` (its `WEB_OAUTH_CLIENT_ID` line goes to `$GITHUB_ENV`), builds of mcp and web, Playwright's Chromium (cached in `~/.cache/ms-playwright`, no `PW_CHROMIUM_PATH` there), then `test:e2e`.
- Required variables: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `WEB_URL`, `MCP_URL`, `WEB_OAUTH_CLIENT_ID`, `E2E_MOCK_MODEL=1`.
- With `CI` set the HTML report goes to `apps/web/playwright-report`, uploaded as an artifact together with `test-results` (traces).
- The `storybook` job runs `pnpm --filter @bibi/ui build-storybook`.

## In-memory payment providers
- `E2E_MEMORY_PROVIDERS=1` (set by `playwright.config.ts`, ignored when `NODE_ENV=production`, same policy as the mock model) makes the web server install in-memory Stripe and Swish at start (`installE2eProviders` in core, process-wide). Stripe connects at once through `/payment-account/onboarding` and `/sync`; its checkout link carries the pay page in `back`. Swish connects with any `swishNumber`. Both take unsigned test deliveries on `/api/providers/<key>/webhook` (`{ eventId, signals: [...] }`), so a spec can mark a checkout paid (`payment-fixtures.ts`). The config also passes a throwaway `INTEGRATION_SECRET_KEY` when none is set.

## The scripted model
- `E2E_MOCK_MODEL=1` (and `NODE_ENV` not `production`, see `server/mock-model-policy.ts`) makes `assistant-handlers.ts` dynamically import `server/e2e-mock-model.ts` (`MockLanguageModelV4` from `ai/test`): "create venue <name>" → `venue_create`, "list venues" → `venue_list`, "list skills" → `skill_list`, "rename responsibility <id> <name>" → `responsibility_update`.
