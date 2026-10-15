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
- **Address scheme:** `booking-<bookingId>@<MAIL_INBOUND_DOMAIN>`. Booking ids are random cuid2 strings, so one booking's address does not reveal another's, and the id alone resolves the organization. The local part is matched case-insensitively; unknown or archived bookings are dropped and logged (`mail.unmatched`) with HTTP 200, so the provider does not retry.
- **Flow:** `POST /api/webhooks/resend` (surface `webhook`, wrapped in `withRequestLogging`) → `parseInbound` verifies the Svix signature (401 otherwise) → `fetchInbound` loads body, recipients and attachment metadata from `GET /emails/receiving/{id}` (503 on provider trouble so Resend retries) → core `deliverInboundEmail` resolves the booking (the one cross-organization lookup: it reads only the id pair) and runs `inboundEmail.receive` as SYSTEM in that organization. Logs `mail.received` with the sender masked, never the body.
- **Entity `InboundEmail`:** append-only, org-scoped, linked to the booking; unique per `(organizationId, providerEmailId)` so a redelivered webhook is stored once. Attachments are stored as metadata (`id`, `filename`, `contentType`, `size`); the bytes stay at Resend. Read with `inboundEmail.list` (per booking) and `inboundEmail.get` (permission `booking:read`) on web, GraphQL (`Booking.inboundEmails`), REST and MCP.
- **Parity exception (ADR 0003):** `inboundEmail.receive` is a SYSTEM-only command and is not registered in `createCoreOperations`, so it has no web, GraphQL, REST or MCP surface. No user or AI may fabricate a received mail; the handler also refuses any non-SYSTEM actor.
- **HTML bodies** are stored but never rendered in the web app (untrusted markup); the plain-text body is shown.
- DNS for the inbound subdomain: `docs/runbooks/inbound-email.md`.
