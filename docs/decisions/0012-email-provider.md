# 0012 – Email provider

- **Date:** 2026-10-14
- **Status:** Accepted

## Context
- Okazi needs to send email (confirmations, options, sheets) and receive email (replies linked to a booking).
- Running our own mail server was rejected: port 25 is blocked at many VPS providers, and IP reputation and deliverability to Gmail and Microsoft are a risk for the product.
- Hosting is one or more of our own VPSs (see the upcoming hosting ADR). The mail server should not be part of it.

## Decision
- **Resend** for both outgoing and incoming email.
  - Free during development and pilot (3,000 emails/month, 100/day).
  - Pro (20 USD/month, 50,000 emails) in production.
- **Outgoing:** via API (alternatively SMTP).
- **Incoming:** `email.received` webhook, signed with Svix. The payload contains metadata only. Body and attachments are fetched through Resend's API. The webhook verifies the signature (Zod at the boundary) and runs as a core operation per ADR 0003.
- **Address per booking** on a dedicated inbound subdomain, so replies can be linked to the right `organizationId` and booking.
- **`MailProvider` interface** in its own package with `send` and `parseInbound`. An adapter is chosen via env in `@okazi/config`. Mailpit is used in dev through the same interface.
- **Fallback:** Amazon SES (cheapest) behind the same interface if price or EU requirements justify a switch.

## Alternatives considered
- Mailgun: inbound routes with push, but more expensive per email.
- Postmark: best reputation, but US-based and inbound not confirmed.
- Amazon SES: cheapest, but inbound must be built by us (S3/SNS).
- Own mail server (Stalwart, Mailcow): rejected, see Context.

## Consequences
- No mail server to operate. Hosting needs only app and database.
- SPF, DKIM and DMARC are set up on our own domain following Resend's guide.
- **Open, must be resolved before production:** Resend's EU region and data processing agreement (GDPR) are not confirmed.
- Changing provider means writing an adapter, not a rewrite.

## Addendum 2026-10-15
- Resend operates an EU region, and we accept it for production. Use the EU region and sign Resend's data processing agreement before the first production send. The open GDPR item above is closed.

## Addendum 2026-10-15: inbound mail implemented (#71)
- The address per ticket is `ticket-<ticketId>@<MAIL_INBOUND_DOMAIN>` (originally `booking-<id>`; ADR 0043). Ids are random cuid2 strings, so one address does not reveal another's and the id alone resolves the organization. Unknown or archived tickets are dropped and logged (`mail.unmatched`) with HTTP 200 so the provider does not retry.
- `POST /api/webhooks/resend` verifies the Svix signature, fetches the body from Resend and runs the SYSTEM-only command `inboundEmail.receive` in the resolved organization (the one cross-organization lookup). It is a parity exception (ADR 0003): no user or AI may fabricate a received mail. `InboundEmail` is append-only and unique per `(organizationId, providerEmailId)`, so a redelivery is stored once. HTML bodies are stored but never rendered.
- Flow details and the test setup are in `packages/mail/CLAUDE.md`; DNS for the inbound subdomain is in `docs/runbooks/inbound-email.md`.
