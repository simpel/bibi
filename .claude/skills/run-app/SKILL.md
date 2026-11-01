---
name: run-app
description: Start Bibi (web, MCP server, worker) in a cloud container with no Docker, sign in as a seeded demo user and take screenshots. Use when asked to run the project, see it working, or screenshot a page from a cloud session.
---

# Run the app in a cloud container

Verified in a Linux cloud container with no Docker daemon, Node 22 and pnpm. The container is temporary, so repeat this in each new session. `localhost` is the container itself: the user cannot open it, so show the result with screenshots (`SendUserFile`).

## 1. Database (system Postgres 16 plus pgvector)

```bash
apt-get install -y postgresql-16-pgvector || (apt-get update -qq && apt-get install -y postgresql-16-pgvector)
pg_ctlcluster 16 main start
su postgres -c "psql -c \"CREATE ROLE bibi LOGIN SUPERUSER PASSWORD 'bibi';\" -c 'CREATE DATABASE bibi OWNER bibi;'"
```

## 2. Dependencies, `.env`, migrations

The repo has `.exampleenv`, not `.env.example`. `.env` is gitignored.

```bash
pnpm install
sed -e "s|^BETTER_AUTH_SECRET=.*|BETTER_AUTH_SECRET=$(openssl rand -base64 32)|" -e '/^PW_CHROMIUM_PATH/d' .exampleenv > .env
pnpm db:migrate
pnpm --filter @bibi/db exec prisma generate   # required before any tsx script
pnpm --filter @bibi/core seed:skills
pnpm --filter @bibi/web provision:oauth        # prints WEB_OAUTH_CLIENT_ID=...
```

Put the printed `WEB_OAUTH_CLIENT_ID=<value>` in `.env`, replacing the empty line (never two lines).

## 3. Mail catcher (needed for sign-in codes)

No Docker means no Mailpit container. Download the binary into the scratchpad and run it:

```bash
curl -fsSL -o mp.tgz https://github.com/axllent/mailpit/releases/latest/download/mailpit-linux-amd64.tar.gz
tar xzf mp.tgz mailpit && (nohup ./mailpit > mailpit.log 2>&1 &)   # SMTP :1025, UI/API :8025
```

## 4. Demo data

```bash
pnpm --filter @bibi/core seed:demo
```

Creates `lindholmen-demo` and `vingaleden-demo`. Users are `firstname.lastname@<slug>.bibi.test`, e.g. `anna.berg@lindholmen-demo.bibi.test` (admin). Spec: `docs/demo-seed.md`.

## 5. Start the apps

`pnpm dev` fails in the container (`turbo` reports "Exec format error" spawning children). Start each app from its folder instead, each in the background with its own log:

```bash
(cd apps/web && nohup pnpm dev > web.log 2>&1 &)      # :3330
(cd apps/mcp && nohup pnpm dev > mcp.log 2>&1 &)      # :3331
(cd apps/worker && nohup pnpm dev > worker.log 2>&1 &)
```

Check: `curl -sL -o /dev/null -w '%{http_code} %{url_effective}\n' localhost:3330` gives `200 .../sv/login`. `curl localhost:3331/mcp` gives 405 (expected for GET). The first request compiles slowly.

## 6. Sign in and screenshot

The login page's "Dev users" switcher did nothing when driven with Playwright. Use the one-time code through the auth API instead (the code is in Mailpit):

```bash
curl -s -X POST localhost:3330/api/auth/email-otp/send-verification-otp -H 'Content-Type: application/json' -H 'Origin: http://localhost:3330' -d '{"email":"anna.berg@lindholmen-demo.bibi.test","type":"sign-in"}'
CODE=$(curl -s localhost:8025/api/v1/message/latest | python3 -c "import sys,json,re;print(re.search(r'\b\d{6}\b',json.load(sys.stdin)['Text']).group())")
```

In a Playwright script (`NODE_PATH=$(npm root -g) node script.js`, never install Playwright), post the code in the browser context so the session cookie is kept, then open pages:

```js
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await ctx.request.post('http://localhost:3330/api/auth/sign-in/email-otp', {
  headers: { Origin: 'http://localhost:3330' },
  data: { email: 'anna.berg@lindholmen-demo.bibi.test', otp: CODE },
});
const page = await ctx.newPage();
await page.goto('http://localhost:3330/en/lindholmen-demo/tickets', { waitUntil: 'networkidle' });
await page.screenshot({ path: 'tickets.png' });
```

Pages that exist: `/en/lindholmen-demo/` (assistant), `tickets`, `pipeline`, `calendar`. Codes expire, so request a fresh one per sign-in. Look at the screenshots before reporting.

## Not covered

- The assistant chat needs a real `AI_GATEWAY_API_KEY` (set it as an environment secret, never in chat). Everything else works without it.
- Storybook (`:3332`) is not started.
- Why Turbo fails here is unknown.
