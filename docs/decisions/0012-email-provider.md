# 0012 – Email provider

- **Date:** 2026-10-14
- **Status:** Accepted

## Context
- Bibi sends email (confirmations, sheets) and receives replies that must link to an order.
- Our own mail server is a risk: port 25 is blocked at many VPS providers, and IP reputation and deliverability to Gmail and Microsoft are fragile.
- Hosting should stay as small as app plus database.

## Decision
1. Resend handles outgoing and incoming mail, using its EU region under its data processing agreement.
2. Outgoing goes through the API. Incoming arrives as a Svix-signed `email.received` webhook with metadata only; the body is fetched through Resend's API.
3. Each order has its own address `order-<orderId>@<inbound domain>`. Ids are random cuid2, so one address does not reveal another and the id alone resolves the organization. Unknown or archived orders are dropped and logged with HTTP 200 so the provider does not retry.
4. The webhook runs the SYSTEM-only command `inboundEmail.receive`. This is a parity exception (ADR 0003): no user or AI may fabricate a received mail. `InboundEmail` is append-only and unique per organization and provider id, so a redelivery is stored once.
5. A `MailProvider` interface (`send`, `parseInbound`) hides the provider. The adapter is chosen via `@bibi/config`; Mailpit is the dev adapter.
6. Amazon SES is the fallback behind the same interface.

## Rejected
- Own mail server (Stalwart, Mailcow): see Context.
- Mailgun: more expensive per email.
- Postmark: US-based, inbound not confirmed.
- Amazon SES as first choice: cheapest, but we would build inbound ourselves.

## Consequences
- No mail server to operate.
- SPF, DKIM and DMARC are set up on our domain.
- Changing provider means writing an adapter, not a rewrite.
- HTML bodies of inbound mail are stored but never rendered.
