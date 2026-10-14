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
