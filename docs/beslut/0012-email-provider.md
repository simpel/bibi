# 0012 – E-postleverantör

- **Datum:** 2026-10-14
- **Status:** Accepterat

## Kontext
- Okazi behöver skicka (bekräftelser, optioner, blad) och ta emot (svar kopplade till bokning) e-post.
- Egen mailserver förkastades: port 25 är blockerad hos många VPS-leverantörer och IP-rykte/leveransbarhet mot Gmail och Microsoft är en risk för produkten.
- Hosting är en eller flera egna VPS:er (se kommande hosting-ADR). Mailservern ska inte vara en del av den.

## Beslut
- **Resend** för både utgående och inkommande e-post.
  - Free under utveckling och pilot (3 000 mejl/mån, 100/dag).
  - Pro (20 USD/mån, 50 000 mejl) vid skarp drift.
- **Utgående:** via API (alternativt SMTP).
- **Inkommande:** webhook `email.received`, signerad med Svix. Payloaden innehåller endast metadata. Body och bilagor hämtas via Resends API. Webhooken verifierar signaturen (Zod vid gränsen) och körs som en core-operation enligt ADR 0003.
- **Adress per bokning** på en egen inbound-subdomän, så att svar kan kopplas till rätt `organizationId` och bokning.
- **`MailProvider`-interface** i eget paket med `send` och `parseInbound`. En adapter väljs via env i `@okazi/config`. Mailpit används i dev via samma interface.
- **Reserv:** Amazon SES (billigast) bakom samma interface om pris eller EU-krav motiverar byte.

## Alternativ som övervägdes
- Mailgun: inbound-routes med push, men dyrare per mejl.
- Postmark: bäst rykte, men USA-baserat och inbound ej bekräftat.
- Amazon SES: billigast, men inbound måste byggas själv (S3/SNS).
- Egen mailserver (Stalwart, Mailcow): förkastad, se Kontext.

## Konsekvenser
- Ingen mailserver att drifta. Hosting kräver bara app och databas.
- SPF, DKIM och DMARC sätts upp på egen domän enligt Resends guide.
- **Öppet, måste lösas före produktion:** Resends EU-region och personuppgiftsbiträdesavtal (GDPR) är inte bekräftade.
- Leverantörsbyte är en adapter, inte en omskrivning.
