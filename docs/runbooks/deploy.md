# Deploy runbook

Decision: `docs/decisions/0013-hosting-and-deploy.md`.

## Flow
1. Merge to `main`. CI runs `check`, then `publish-images` pushes `ghcr.io/<repo>-web` and `-mcp` tagged with the full git SHA.
2. The `deploy` job (`.github/workflows/deploy.yml`) verifies both images exist, sets `docker_registry_image_tag` on the Coolify applications through the API, triggers a deploy, then polls `/api/health` (web) and `/health` (mcp) for up to 5 minutes. A failed gate fails the run.
3. Migrations run as a one-off step before new containers take traffic and must be backward compatible (expand/contract), so the previous SHA keeps working against the migrated database.

## Rollback
Run the **Rollback** workflow (Actions > Rollback > Run workflow) with the full 40-character SHA of the earlier release (taken from an earlier green Deploy run). It reuses the same deploy job and health gate. Never roll back past a contract migration; restore from backup instead.

## GitHub environment `production`
- Secrets: `COOLIFY_URL`, `COOLIFY_TOKEN` (API token limited to deploy), `COOLIFY_WEB_UUID`, `COOLIFY_MCP_UUID`.
- Variables: `WEB_URL`, `MCP_URL` (public base URLs, no trailing slash).
- Add required reviewers on the environment if deploys should need approval.
- The runner must reach `COOLIFY_URL`. Because the UI is not public, use a Tailscale/WireGuard step on the runner (or a self-hosted runner on the tailnet) before the Coolify calls.

## Coolify access and updates
- The admin UI is never exposed publicly: reach it through VPN (Tailscale/WireGuard) or `ssh -L 8000:localhost:8000 <server>`.
- Few administrators, 2FA on, API tokens scoped and rotated.
- Update routine: check Coolify releases weekly, apply the latest 4.x promptly after a security advisory, take a backup (including Coolify's own instance data) first, then verify a deploy afterwards.

## Hardening
- Hetzner Cloud Firewall: allow only 80, 443 and SSH (SSH restricted to known IPs or the VPN). Port 8000 (Coolify) stays closed.
- SSH keys only, password login off, `unattended-upgrades` enabled.
- Docker log rotation configured; uptime monitoring on the two health endpoints.
