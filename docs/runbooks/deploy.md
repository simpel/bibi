# Deploy runbook

Decision: `docs/decisions/0013-hosting-and-deploy.md`.

## Flow
1. Merge to `main`. CI runs `check`, then `publish-images` pushes `ghcr.io/<repo>-web` and `-mcp` tagged with the full git SHA.
2. The `deploy` job (`.github/workflows/deploy.yml`) verifies the three images exist, opens an SSH tunnel to Coolify as the tunnel-only `deploy` user, sets `IMAGE_TAG` on the one Coolify Docker Compose resource (`docker-compose.prod.yml`: migrate, web, mcp, worker, backup), triggers a deploy, then polls `/api/health` (web) and `/health` (mcp) for up to 10 minutes. A failed gate fails the run.
3. Migrations run as a one-off step before new containers take traffic and must be backward compatible (expand/contract), so the previous SHA keeps working against the migrated database.

## Rollback
Run the **Rollback** workflow (Actions > Rollback > Run workflow) with the full 40-character SHA of the earlier release (taken from an earlier green Deploy run). It reuses the same deploy job and health gate. Never roll back past a contract migration; restore from backup instead.

## GitHub environment `production`
- Secrets: `DEPLOY_HOST` (server IPv4), `DEPLOY_SSH_KEY`, `DEPLOY_SSH_KNOWN_HOSTS` (both printed by `tools/server/bootstrap.sh`), `COOLIFY_TOKEN` (API token with deploy + write), `COOLIFY_APP_UUID`.
- Variables: `WEB_URL`, `MCP_URL` (public base URLs, no trailing slash).
- Add required reviewers on the environment if deploys should need approval.
- Until `DEPLOY_HOST` is set the deploy job skips with a warning.

## First-time server setup
Images on GHCR are public, so the server needs no registry login.

1. **Hetzner Cloud Firewall** (Console > Firewalls), applied to the server. Inbound: TCP 22, 80 and 443 from anywhere. Nothing else: 8000, 6001, 6002 (Coolify) stay closed. SSH is open because GitHub's runners have no fixed IPs; it accepts keys only, `fail2ban` is on, and the `deploy` key can only forward to `localhost:8000`.
2. **Bootstrap the server** from your Mac: `scp tools/server/bootstrap.sh root@<ip>:` then `ssh root@<ip> bash bootstrap.sh` (about 5 minutes). At the end it prints `DEPLOY_HOST`, `DEPLOY_SSH_KEY` (once) and `DEPLOY_SSH_KNOWN_HOSTS`.
3. **DNS**: A records to the server's public IPv4 for `app.`, `mcp.`, the apex and `www.` of the public domain (`heybibi.se`), and for the apex and `www.` of the redirect domain (`heybibi.tech`).
4. **Coolify** (`ssh -L 8000:localhost:8000 -L 6001:localhost:6001 -L 6002:localhost:6002 root@<ip>`, then http://localhost:8000; 6001 and 6002 carry the live log updates): create the admin account, turn on 2FA, keep the instance URL empty.
   - New project `bibi` > New resource > Public repository `https://github.com/simpel/bibi`, branch `main`, build pack *Docker Compose*, compose file `/docker-compose.prod.yml`.
   - Domains (ADR 0073): web `https://app.<domain>:3330`, mcp `https://mcp.<domain>:3331` (the port is the container port). Also on `web`: `https://<domain>:3330`, `https://www.<domain>:3330`, `https://<tld2>:3330` and `https://www.<tld2>:3330`, where `<tld2>` is the redirect domain. The app redirects those to the right host, but each needs its own certificate. Set `PUBLIC_URL=https://<domain>` (the apex) next to `WEB_URL`; unset, the app serves everything on one host.
   - Environment: Coolify lists every `${VAR}` from the compose file. Set `IMAGE_TAG` to the SHA of the latest green CI run on `main`, `POSTGRES_PASSWORD` and `BETTER_AUTH_SECRET` (`openssl rand -hex 32`), `BETTER_AUTH_URL` and `WEB_URL` = `https://app.<domain>`, `MCP_URL` = `https://mcp.<domain>`, the `BACKUP_S3_*` values (`docs/operations/backup-and-restore.md`), mail and AI keys.
   - Deploy once from the UI and check `https://app.<domain>/api/health`.
   - Keys and Tokens > API tokens: create a token with *deploy* and *write*. Copy the resource UUID from its URL.
5. **GitHub** (Settings > Environments > production): add the secrets and variables listed above.
6. **Verify**: push to `main` (or re-run the last CI) and watch the `deploy` job go green.
7. The assistant's OAuth client (`WEB_OAUTH_CLIENT_ID`) cannot be provisioned from the prod image yet: `provision:oauth` needs `tsx`, a dev dependency. Until that is fixed the assistant is off in production; everything else works.

## Coolify access and updates
- The admin UI is never exposed publicly: reach it through `ssh -L 8000:localhost:8000 -L 6001:localhost:6001 -L 6002:localhost:6002 root@<server>`.
- Few administrators, 2FA on, API tokens scoped and rotated.
- Update routine: check Coolify releases weekly, apply the latest 4.x promptly after a security advisory, take a backup (including Coolify's own instance data) first, then verify a deploy afterwards.

## Hardening
- Hetzner Cloud Firewall: allow only 22, 80 and 443. Port 8000 (Coolify) stays closed.
- SSH keys only, password login off, `unattended-upgrades` enabled.
- Docker log rotation configured; uptime monitoring on the two health endpoints.

## Monitoring with Better Stack (ADR 0031)
Account and dashboard steps are manual. The code side is done: the logger ships to Better Stack when both variables are set.

1. **Log shipping.** Create a Better Stack source (platform: HTTP, EU region, 30 days retention). Set `BETTER_STACK_HOST` (ingesting host of the source) and `BETTER_STACK_SOURCE_TOKEN` on the web, mcp and worker apps in Coolify. Lines are the same pino JSON as stdout (`service`, `event`, `requestId`, ...) with `dt` added. Delivery is batched and best effort: stdout stays the source of truth. Unset = no shipping.
2. **Uptime checks.** Create two monitors: `${WEB_URL}/api/health` and `${MCP_URL}/health` (expect 200, 1 minute interval, alert to the on-call email).
3. **Error tracking.** Create a log alert on the source for `level` `error` or `fatal` (for example `process.unhandledRejection`, `process.uncaughtException`, `http.unhandledError`, `operation.failed`), grouped by `event`, sent to the same on-call email.
4. Verify: deploy, open Live tail and check that `http.request` lines from `web` arrive, then stop a container and check the uptime alert fires.
