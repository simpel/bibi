# Deploy runbook

Decisions: `docs/decisions/0013-hosting-and-deploy.md`, `0104-mcp-served-by-the-web-app.md` (MCP runs inside the web container).

## Flow
1. Merging a release PR runs `publish-images` (`release.yml`), which pushes `ghcr.io/<repo>-web`, `-worker`, `-migrate` and `-backup` tagged with the full git SHA. The server never builds an image.
2. The `deploy` job (`.github/workflows/deploy.yml`) verifies the four images exist, opens an SSH tunnel to Coolify as the tunnel-only `deploy` user, sets `IMAGE_TAG` on the one Coolify Docker Compose resource (`docker-compose.prod.yml`: migrate, web, worker, backup), triggers a deploy, waits up to 20 minutes for Coolify's deployment status to reach `finished` (any other end state fails the run and prints Coolify's log), then polls `${WEB_URL}/api/health` and `${MCP_URL}/health` (both served by web, the second through the MCP host's routing) for up to 10 minutes. The health checks alone cannot catch a failed rollout: the previous containers keep answering. Deploys run from `release.yml` when a release PR is merged, not from CI.
3. Migrations run as a one-off step before new containers take traffic and must be backward compatible (expand/contract), so the previous SHA keeps working against the migrated database.

## Disk and memory
The server is small (2 vCPU, 4 GB RAM, 19 GB disk) and runs Coolify, its proxy, Postgres and the apps. On 7–10 Nov 2026 the disk filled up: Postgres crashed into a recovery loop and was OOM-killed, the worker crash-looped, nightly backups failed, and nothing alerted for three days. These settings keep that from happening again.

- **Small images.** `docker/Dockerfile` ships only the files each app loads: web is Next's standalone output (it serves MCP too), the worker is traced by `docker/trace.mjs`, migrate is `packages/db` with the Prisma CLI. A release is about 1 GB of images (it was about 6 GB). Never copy `node_modules` or `.next/cache` into a runtime stage.
- **Docker cleanup** (Coolify > Servers > localhost > Docker cleanup): frequency `0 3 * * *`, trigger **Run on every schedule**, threshold `80`. Keep **Delete unused volumes** off (the database lives in a volume). Coolify keeps the last images of each application for its own rollback; older SHAs are pulled again from GHCR by the Rollback workflow. If the page says "Docker cleanup may be stalled", run `docker exec coolify php artisan cleanup:redis --clear-locks` on the server and press **Run Cleanup**.
- **Memory limits.** Every service in `docker-compose.prod.yml` has a `mem_limit`, and Node's heap (`NODE_OPTIONS=--max-old-space-size`) sits at about 75 % of it. Postgres is tuned for the box with `command:` flags; raise `max_connections` with the pools (`DATABASE_POOL_MAX`).
- **Swap.** The server has a 2 GB swapfile so a spike is slow instead of fatal: `fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile`, add `/swapfile none swap sw 0 0` to `/etc/fstab`, and set `vm.swappiness=10` in `/etc/sysctl.d/99-swap.conf`. Check `df -h /` first: on a nearly full disk `fallocate` fails halfway and leaves a broken file that takes the last free space.
- **Journal size.** `SystemMaxUse=200M` under `[Journal]` in `/etc/systemd/journald.conf.d/size.conf`, then `systemctl restart systemd-journald`.
- **Alerts.** Coolify > Notifications (email): server disk usage, container status changes and failed deployments. The web health checks do not touch the database, so a dead Postgres shows up only as an unhealthy container or a crash-looping worker; these alerts are what catch it. Backups alert through `BACKUP_HEARTBEAT_URL` (`docs/operations/backup-and-restore.md`).
- **Check** after setup and after any deploy failure: `tools/server/coolify-tunnel.sh` prints every Coolify container's state and what Coolify answers; `ssh root@<server> 'df -h / && free -m && docker system df'`.

## Moving MCP into web (once, ADR 0104)
The first release without the `mcp` service removes that container, and its `mcp.<domain>` route with it. In Coolify, during that release's deploy (or right after it, if the health gate fails on `${MCP_URL}/health`):
1. Open the resource's `web` service and add `https://mcp.<domain>:3330` to its domains. Keep `MCP_URL=https://mcp.<domain>`: OAuth grants are bound to it, so connected MCP clients keep working.
2. Save and redeploy from the Rollback workflow with the release's SHA, then check `https://mcp.<domain>/health` and `https://mcp.<domain>/.well-known/oauth-protected-resource`.
3. Delete the old `-mcp` package from GHCR once no rollback target needs it.

## Stuck deployment
Coolify runs one deployment per resource at a time. If a deployment's build container dies, its status can stay `in_progress` and every later deploy queues behind it: the resource header keeps showing "Deploying…" and Environment Variables show "Changes pending". The deploy job then fails at "No earlier Coolify deployment is still running" and names the deployment.
1. Open the deployment (the "Deploying…" link) and read its log to the end; note the last line for the cause.
2. Cancel it there. Do not edit `IMAGE_TAG` or press Redeploy by hand.
3. Re-run the failed deploy through GitHub: the Rollback workflow with the SHA you want live (for a release that never rolled out, that release's SHA). It goes through the same checks and health gate.

## Rollback
Run the **Rollback** workflow (Actions > Rollback > Run workflow) with the full 40-character SHA of the earlier release (taken from an earlier green Deploy run). It reuses the same deploy job and health gate. Never roll back past a contract migration; restore from backup instead.

## GitHub environment `production`
- Secrets: `DEPLOY_HOST` (server IPv4), `DEPLOY_SSH_KEY`, `DEPLOY_SSH_KNOWN_HOSTS` (both printed by `tools/server/bootstrap.sh`), `COOLIFY_TOKEN` (API token with deploy + write), `COOLIFY_APP_UUID`.
- Variables: `WEB_URL`, `MCP_URL` (public base URLs, no trailing slash).
- Add required reviewers on the environment if deploys should need approval.
- Until `DEPLOY_HOST` is set the deploy job skips with a warning.

## First-time server setup
Images on GHCR are public, so the server needs no registry login. A new image name (such as `-migrate` or `-backup`) starts private on its first push: set it to public under the repository's Packages before the deploy that needs it.

1. **Hetzner Cloud Firewall** (Console > Firewalls), applied to the server. Inbound: TCP 22, 80 and 443 from anywhere. Nothing else: 8000, 6001, 6002 (Coolify) stay closed. SSH is open because GitHub's runners have no fixed IPs; it accepts keys only, `fail2ban` is on, and the `deploy` key can only forward to `localhost:8000`.
2. **Bootstrap the server** from your Mac: `scp tools/server/bootstrap.sh root@<ip>:` then `ssh root@<ip> bash bootstrap.sh` (about 5 minutes). At the end it prints `DEPLOY_HOST`, `DEPLOY_SSH_KEY` (once) and `DEPLOY_SSH_KNOWN_HOSTS`.
3. **DNS**: A records to the server's public IPv4 for `app.`, `mcp.`, the apex and `www.` of the public domain (`heybibi.se`), and for the apex and `www.` of the redirect domain (`heybibi.tech`).
4. **Coolify** (`ssh -L 8000:localhost:8000 -L 6001:localhost:6001 -L 6002:localhost:6002 root@<ip>`, then http://localhost:8000; 6001 and 6002 carry the live log updates): create the admin account, turn on 2FA, keep the instance URL empty.
   - New project `bibi` > New resource > Public repository `https://github.com/simpel/bibi`, branch `main`, build pack *Docker Compose*, compose file `/docker-compose.prod.yml`.
   - Domains (ADR 0073, 0104), all on `web` (the port is the container port): `https://app.<domain>:3330`, `https://mcp.<domain>:3330`, `https://<domain>:3330`, `https://www.<domain>:3330`, `https://<tld2>:3330` and `https://www.<tld2>:3330`, where `<tld2>` is the redirect domain. The app redirects those to the right host, but each needs its own certificate. Set `PUBLIC_URL=https://<domain>` (the apex) next to `WEB_URL`; unset, the app serves everything on one host.
   - Environment: Coolify lists every `${VAR}` from the compose file. Set `IMAGE_TAG` to the SHA of the latest green CI run on `main`, `POSTGRES_PASSWORD` and `BETTER_AUTH_SECRET` (`openssl rand -hex 32`), `BETTER_AUTH_URL` and `WEB_URL` = `https://app.<domain>`, `MCP_URL` = `https://mcp.<domain>`, the `BACKUP_S3_*` values (`docs/operations/backup-and-restore.md`; then run a backup on demand and check the dump is in the bucket, because a placeholder value only fails in the container log), the `S3_*` file storage values (`docs/runbooks/object-storage.md`), mail and AI keys. `DATABASE_POOL_MAX` (default 10) sizes each process's pool: keep web + worker (+1 for the notification listener) below Postgres `max_connections`, or put PgBouncer (transaction mode) in front (ADR 0097).
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

1. **Log shipping.** Create a Better Stack source (platform: HTTP, EU region, 30 days retention). Set `BETTER_STACK_HOST` (ingesting host of the source) and `BETTER_STACK_SOURCE_TOKEN` on the web and worker apps in Coolify. Lines are the same pino JSON as stdout (`service`, `event`, `requestId`, ...) with `dt` added. Delivery is batched and best effort: stdout stays the source of truth. Unset = no shipping.
2. **Uptime checks.** Create two monitors: `${WEB_URL}/api/health` and `${MCP_URL}/health` (expect 200, 1 minute interval, alert to the on-call email).
3. **Error tracking.** Create a log alert on the source for `level` `error` or `fatal` (for example `process.unhandledRejection`, `process.uncaughtException`, `http.unhandledError`, `operation.failed`), grouped by `event`, sent to the same on-call email.
4. Verify: deploy, open Live tail and check that `http.request` lines from `web` arrive, then stop a container and check the uptime alert fires.
