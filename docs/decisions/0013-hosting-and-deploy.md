# 0013 – Hosting and deploy

- **Date:** 2026-10-14
- **Status:** Accepted

## Context
- Requirements: simple, cheap, self-operated, EU region (GDPR, Swedish customers). Email is external (ADR 0012).
- Kamal was considered, but Coolify offers a UI, database management, backups and a larger community.
- Coolify has a heavy security history (critical CVEs in 2026) and holds root SSH access to the servers, so its control plane is a high-risk component.

## Decision
1. Hetzner Cloud in an EU region. One server for web, mcp and Postgres to start; scale by size, and move Postgres out when needed.
2. Postgres is self-hosted `pgvector/pgvector` in a container on a Hetzner Volume, since Hetzner has no managed Postgres.
3. Backup is a nightly `pg_dump` of the whole database (including the worker's schema, ADR 0027) to object storage, plus Hetzner server backup. Restore is tested before the first customer.
4. Images are built in GitHub Actions after CI is green on `main`, published to GHCR and tagged with the git SHA. The same image runs everywhere.
5. Coolify deploys one compose resource from `docker-compose.prod.yml`, so the service definition is in git. GitHub Actions deploys by setting `IMAGE_TAG` through Coolify's API, with a health gate. Rollback deploys the previous SHA (runbook `docs/runbooks/deploy.md`).
6. The Coolify UI is never public. Admins and the runner reach it over an SSH tunnel as a `deploy` user restricted to forwarding to Coolify's port.
7. Migrations run as a one-off step before new containers take traffic and must be backward compatible (expand and contract).
8. Separate domains for the web app and the MCP server, since OAuth needs a stable public HTTPS URL.
9. Secrets live in GitHub and Coolify, never in the repo, and are read through `@bibi/config`.

## Rejected
- Kamal: less UI and database handling.
- Hostinger and Railway: ruled out on requirements.
- A VPN such as Tailscale for Coolify access: an extra account and moving part.
- Managed Postgres: not available at Hetzner.

## Consequences
- Low cost (5 to 15 EUR a month) and low lock-in, since everything is ordinary Docker.
- Coolify is a stateful control plane we must patch quickly, and settings outside the compose file are harder to review.
- We own backup, updates and restore.
- One server is a single point of failure; accepted for the pilot. Staging: ADR 0031.
