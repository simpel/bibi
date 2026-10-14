# 0013 – Hosting och deploy

- **Datum:** 2026-10-14
- **Status:** Föreslaget

## Kontext
- Krav: enkelt, billigt, egen drift, EU-region (GDPR, svenska kunder). Hostinger och Railway är uteslutna.
- E-post hanteras externt (ADR 0012), så ingen mailserver behövs på hostingen.
- Kamal övervägdes (stateless, konfiguration i git, MIT, aktivt underhållen) men Coolify valdes för UI, inbyggd databas- och backuphantering och större community.
- Coolify har en tung säkerhetshistorik: flera kritiska CVE:er (CVSS upp till 10.0) i januari 2026 och fortsatta kommandoinjektionsbuggar under 2026. Merparten kräver en autentiserad användare. Kontrollplanet har root-åtkomst via SSH till servrarna och måste därför behandlas som en högriskkomponent.
- Projektet har redan en `docker/Dockerfile` och compose-profilen `app` (web + mcp).

## Beslut
- **Leverantör:** Hetzner Cloud, EU-region (Falkenstein/Nürnberg eller Helsingfors).
- **Start:** en server för web, mcp och Postgres. Skala genom att byta serverstorlek, och flytta Postgres till egen server vid behov.
- **Databas:** självhostad `pgvector/pgvector` i container med data på en Hetzner Volume. Hetzner har ingen managed Postgres.
- **Backup:** nattlig `pg_dump` till Hetzner Object Storage (eller Storage Box), plus Hetzners serverbackup. Återställning testas före första kund.
- **Bilder:** byggs i GitHub Actions efter att CI är grön på `main`, publiceras till GHCR och taggas med git-SHA. Samma bild används i alla miljöer.
- **Deploy-plattform:** Coolify (självhostad, Apache-2.0) på samma server. Coolify sköter proxy med TLS (Let's Encrypt), miljövariabler, databashantering och schemalagda databasbackuper till S3-kompatibel lagring.
- **Deploy-flöde:** GitHub Actions triggar en deploy via Coolifys API/webhook med den nya bildens SHA-tagg. Rollback sker genom att deploya föregående SHA.
- **Konfiguration i git:** applikationerna deployas från en `docker-compose.prod.yml` i repot, så att tjänstedefinitionen är versionerad. UI-inställningar begränsas till domäner, hemligheter och backupschema.
- **Coolify-säkerhet (se Kontext):** admin-UI:t exponeras inte publikt. Det nås via VPN (Tailscale/WireGuard) eller SSH-tunnel. Coolify hålls uppdaterad till senaste 4.x-version, få administratörer, och Coolifys egen instansdata ingår i backupen.
- **Migrationer:** `prisma migrate deploy` körs som ett engångssteg före att nya containrar tar trafik. Migrationer ska vara bakåtkompatibla (expand/contract).
- **Domäner:** `app.` för webben och `mcp.` för MCP-servern (OAuth kräver stabil publik HTTPS-URL).
- **Hemligheter:** GitHub environment secrets och Coolifys hemlighetshantering. Aldrig i repot. Alla läses via `@okazi/config`.
- **Hårdning:** Hetzner Cloud Firewall (80, 443 och SSH), endast SSH-nycklar, unattended-upgrades.
- **Drift:** hälsoendpoints för web och mcp som deploy-grind, Docker-loggrotation, uptime-övervakning och felspårning.

## Öppet
- Kontrollplan på egen liten server (blast radius) eller på samma server som appen? Startar på samma server med låst UI.
- Staging: en andra, liten server, eller bara produktion i början?
- Schemaläggare för optionsförfall och köksordrar (cron-container eller jobbkö i Postgres), vilket påverkar antalet containrar.
- Arm (CAX) kräver multi-arch-bilder. Utgå från x86 tills vidare.
- Serverstorlek och exakta priser ska verifieras mot Hetzners prislista.

## Konsekvenser
- Låg kostnad (storleksordning 5–15 EUR/månad). Leverantörsinlåsning är låg, eftersom tjänsterna är vanliga Docker-bilder och compose-filer.
- Coolify är ett extra tillståndsbärande kontrollplan som vi måste patcha snabbt. Konfiguration utanför compose-filen ligger i Coolifys databas och är svårare att granska.
- Vi äger backup, uppdateringar och återställning av databasen.
- En enda server är en enskild felpunkt tills vi har staging och en andra nod. Accepterat för pilot.
- Ersätter "Produktionsmiljö och hosting ej beslutad" i `CLAUDE.md`.
