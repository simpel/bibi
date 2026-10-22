# Inbound email (Resend)

How customer replies reach a booking (ADR 0012). Each booking has its own address,
`booking-<bookingId>@<MAIL_INBOUND_DOMAIN>`, shown on the booking page.

## DNS
Use a dedicated subdomain for inbound mail (e.g. `in.bibi.se`): Resend receives *all* mail for a
domain with receiving enabled, so the apex domain's own mail (MX, inboxes) must stay untouched.
Add the subdomain as a domain in Resend (EU region, see the ADR 0012 addendum), toggle
**Receiving** on its page and copy the exact records Resend shows. Their shape, for `in.bibi.se`:

| Record | Name | Value | Why |
| --- | --- | --- | --- |
| MX | `in` | `inbound-smtp.<region>.amazonaws.com` (the lowest priority value on `in`) | Delivers mail for the subdomain to Resend |
| MX | `send.in` | `feedback-smtp.<region>.amazonses.com` (priority 10) | Return path for bounces and complaints |
| TXT (SPF) | `send.in` | `v=spf1 include:amazonses.com ~all` | Authorises Resend to send for the subdomain |
| TXT (DKIM) | `resend._domainkey.in` | the public key Resend shows | Signs mail from the subdomain |
| TXT (DMARC) | `_dmarc.in` | `v=DMARC1; p=none; rua=mailto:<postmaster address>` | Policy and reports; tighten to `quarantine` once reports are clean |

- Resend only receives when its MX record has the lowest priority value for the subdomain.
- Wait until Resend shows the subdomain as verified before setting `MAIL_INBOUND_DOMAIN`.
- Outgoing mail (`MAIL_FROM`) keeps its own verified domain and records; this runbook covers
  only the inbound subdomain.

## Webhook
1. In Resend, add a webhook for the event `email.received` with the URL
   `https://<WEB_URL host>/api/webhooks/resend`.
2. Copy its signing secret (`whsec_...`) into `RESEND_WEBHOOK_SECRET`.
3. Set `MAIL_INBOUND_DOMAIN` to the inbound subdomain and `RESEND_API_KEY` (the API key must be
   allowed to read received emails).
4. Redeploy. Send a mail to a booking's address and check the booking page and the system log
   (`mail.received`, or `mail.unmatched` for an unknown address).

## Responses
- 200 `stored` / `duplicate` / `unmatched` / `ignored` (not an `email.received` event).
- 401: signature invalid or older than five minutes. 400: malformed payload.
- 503: `MAIL_INBOUND_DOMAIN` or `RESEND_WEBHOOK_SECRET` unset, or Resend's API failed (Resend
  retries).
