# 0013 – Hosting and deploy

- **Date:** 2026-10-14
- **Status:** Accepted

## Context
- Requirements: simple, cheap, self-operated, EU region (GDPR, Swedish customers). Hostinger and Railway are ruled out.
- Email is handled externally (ADR 0012), so no mail server is needed on the hosting.
- Kamal was considered (stateless, configuration in git, MIT, actively maintained) but Coolify was chosen for its UI, built-in database and backup handling and larger community.
- Coolify has a heavy security history: several critical CVEs (CVSS up to 10.0) in January 2026 and continued command injection bugs during 2026. Most require an authenticated user. The control plane has root access over SSH to the servers and must therefore be treated as a high-risk component.
- The project already has a `docker/Dockerfile` and the compose profile `app` (web + mcp).

## Decision
- **Provider:** Hetzner Cloud, EU region (Falkenstein/Nürnberg or Helsinki).
- **Start:** one server for web, mcp and Postgres. Scale by changing server size, and move Postgres to its own server when needed.
- **Database:** self-hosted `pgvector/pgvector` in a container with data on a Hetzner Volume. Hetzner has no managed Postgres.
- **Backup:** nightly `pg_dump` (the whole database, including the worker's `pgboss` schema, ADR 0027) to Hetzner Object Storage (or Storage Box), plus Hetzner's server backup. Restore is tested before the first customer.
- **Images:** built in GitHub Actions after CI is green on `main`, published to GHCR and tagged with the git SHA. The same image is used in all environments.
- **Deploy platform:** Coolify (self-hosted, Apache-2.0) on the same server. Coolify handles proxy with TLS (Let's Encrypt), environment variables, database management and scheduled database backups to S3-compatible storage.
- **Deploy flow:** GitHub Actions triggers a deploy through Coolify's API by setting `IMAGE_TAG` on one Docker Compose resource built from `docker-compose.prod.yml`. Rollback is done by deploying the previous SHA. Implemented as `.github/workflows/deploy.yml` (reusable, called from CI after `publish-images`, with a health gate on `/api/health` and `/health`) and the manual `rollback.yml`. See `docs/runbooks/deploy.md`.
- **Configuration in git:** the applications are deployed from a `docker-compose.prod.yml` in the repo, so the service definition is versioned. UI settings are limited to domains, secrets and backup schedule.
- **Coolify security (see Context):** the admin UI is not exposed publicly. Admins reach it through an SSH tunnel; the GitHub runner reaches its API the same way, as a `deploy` user whose key may only forward to the Coolify port (a VPN such as Tailscale was rejected as an extra account and moving part). Coolify is kept updated to the latest 4.x version, with few administrators, and Coolify's own instance data is included in the backup.
- **Migrations:** `prisma migrate deploy` runs as a one-off step before new containers take traffic. Migrations must be backward compatible (expand/contract).
- **Domains:** `app.` for the web app and `mcp.` for the MCP server (OAuth requires a stable public HTTPS URL).
- **Secrets:** GitHub environment secrets and Coolify's secret management. Never in the repo. All are read through `@bibi/config`.
- **Hardening:** Hetzner Cloud Firewall (80, 443 and SSH), SSH keys only, fail2ban, unattended-upgrades. SSH is open to all IPs because GitHub's runners have no fixed range.
- **Operations:** health endpoints for web and mcp as a deploy gate, Docker log rotation, uptime monitoring and error tracking.

## Open
- Control plane on its own small server (blast radius) or on the same server as the app? Starts on the same server with a locked-down UI.
- Staging: decided in ADR 0031 (production only until the first paying venue).
- Arm (CAX) requires multi-arch images. Assume x86 for now.
- Server size and exact prices must be verified against Hetzner's price list.

## Consequences
- Low cost (on the order of 5–15 EUR/month). Vendor lock-in is low, because the services are ordinary Docker images and compose files.
- Coolify is an extra stateful control plane that we must patch quickly. Configuration outside the compose file lives in Coolify's database and is harder to review.
- We own backup, updates and restore of the database.
- A single server is a single point of failure until we have staging and a second node. Accepted for the pilot.
- Replaces "Production environment and hosting not decided" in `CLAUDE.md`.
