# 0013 – Hosting och deploy

- **Datum:** 2026-10-14
- **Status:** Föreslaget

## Kontext
- Krav: enkelt, billigt, egen drift, EU-region (GDPR, svenska kunder). Hostinger och Railway är uteslutna.
- E-post hanteras externt (ADR 0012), så ingen mailserver behövs på hostingen.
- Projektet har redan en `docker/Dockerfile` och compose-profilen `app` (web + mcp).

## Beslut
- **Leverantör:** Hetzner Cloud, EU-region (Falkenstein/Nürnberg eller Helsingfors).
- **Start:** en server för web, mcp och Postgres. Skala genom att byta serverstorlek, och flytta Postgres till egen server vid behov.
- **Databas:** självhostad `pgvector/pgvector` i container med data på en Hetzner Volume. Hetzner har ingen managed Postgres.
- **Backup:** nattlig `pg_dump` till Hetzner Object Storage (eller Storage Box), plus Hetzners serverbackup. Återställning testas före första kund.
- **Bilder:** byggs i GitHub Actions efter att CI är grön på `main`, publiceras till GHCR och taggas med git-SHA. Samma bild används i alla miljöer.
- **Deploy:** Kamal över SSH. kamal-proxy sköter TLS (Let's Encrypt) och zero-downtime. Rollback sker genom att deploya föregående SHA.
- **Migrationer:** `prisma migrate deploy` körs som ett engångssteg före att nya containrar tar trafik. Migrationer ska vara bakåtkompatibla (expand/contract).
- **Domäner:** `app.` för webben och `mcp.` för MCP-servern (OAuth kräver stabil publik HTTPS-URL).
- **Hemligheter:** GitHub environment secrets och Kamal secrets. Aldrig i repot. Alla läses via `@okazi/config`.
- **Hårdning:** Hetzner Cloud Firewall (80, 443 och SSH), endast SSH-nycklar, unattended-upgrades.
- **Drift:** hälsoendpoints för web och mcp som deploy-grind, Docker-loggrotation, uptime-övervakning och felspårning.

## Öppet
- Staging: en andra, liten server, eller bara produktion i början?
- Schemaläggare för optionsförfall och köksordrar (cron-container eller jobbkö i Postgres), vilket påverkar antalet containrar.
- Arm (CAX) kräver multi-arch-bilder. Utgå från x86 tills vidare.
- Serverstorlek och exakta priser ska verifieras mot Hetzners prislista.

## Konsekvenser
- Låg kostnad (storleksordning 5–15 EUR/månad) och ingen leverantörsinlåsning, eftersom Kamal bara behöver SSH och Docker.
- Vi äger backup, uppdateringar och återställning av databasen.
- En enda server är en enskild felpunkt tills vi har staging och en andra nod. Accepterat för pilot.
- Ersätter "Produktionsmiljö och hosting ej beslutad" i `CLAUDE.md`.
