# E2E (Playwright)

Run with a scripted model (`E2E_MOCK_MODEL=1`), never a paid AI call.

## Run locally
- Chromium is preinstalled at `/opt/pw-browsers/chromium`; never run `playwright install`.
- Build `pnpm --filter @okazi/mcp build` and `pnpm --filter @okazi/web build`.
- Set `DATABASE_URL`, `BETTER_AUTH_SECRET` (>= 32 characters), `BETTER_AUTH_URL=http://localhost:3000` and `WEB_OAUTH_CLIENT_ID`, then run `pnpm --filter @okazi/web test:e2e`.
- `playwright.config.ts` starts MCP (`node ../mcp/dist/http.js`, :3001) and the web app (`pnpm start`, :3000) with `E2E_MOCK_MODEL=1` and `NODE_ENV=test` (`next start` otherwise sets `production`, where the flag is ignored). Servers that are already running are reused.
- The ports come from `WEB_URL`/`MCP_URL` in the root `.env` (default 3000/3001). Worktrees from `pnpm wt:new` get their own ports and database via `tools/worktree/setup.sh`; `dev` and `start` read `WEB_PORT`.
- `E2E_SCREENSHOTS_DIR=<dir>` enables `screenshots.spec.ts` (light/dark, desktop/mobile).

## CI (`e2e` job in `.github/workflows/ci.yml`)
- Postgres service, `db:migrate`, `seed:skills`, `provision:oauth` (its `WEB_OAUTH_CLIENT_ID` line goes to `$GITHUB_ENV`), builds of mcp and web, Playwright's Chromium (cached in `~/.cache/ms-playwright`, no `PW_CHROMIUM_PATH` there), then `test:e2e`.
- Required variables: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `WEB_URL`, `MCP_URL`, `WEB_OAUTH_CLIENT_ID`, `E2E_MOCK_MODEL=1`.
- With `CI` set the HTML report goes to `apps/web/playwright-report`, uploaded as an artifact together with `test-results` (traces).
- The `storybook` job runs `pnpm --filter @okazi/ui build-storybook`.

## The scripted model
- `E2E_MOCK_MODEL=1` (and `NODE_ENV` not `production`, see `server/mock-model-policy.ts`) makes `assistant-handlers.ts` dynamically import `server/e2e-mock-model.ts` (`MockLanguageModelV4` from `ai/test`): "create venue <name>" → `venue_create`, "list venues" → `venue_list`, "list skills" → `skill_list`.
