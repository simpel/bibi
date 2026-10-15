# @okazi/mail – context for Claude

Email behind one interface (ADR 0012). The only package that talks to nodemailer or Resend.

## API
- `sendMail({ to, subject, text, html?, replyTo?, attachments? })` → `Result<SentMail>`. Validates with `MailMessageSchema`, sends through `getMailProvider()`, logs `mail.sent` (with `provider`, masked `recipient`, `subject`, `durationMs`) or `mail.failed`. Never logs the body.
- `MailProvider`: `send({ message })`, `parseInbound({ request: { headers, body } })` and `fetchInbound({ providerEmailId })`. `parseInbound` verifies the webhook and returns `null` for events that are not received mail; `fetchInbound` loads the body, recipients (to, cc, received-for) and attachment metadata.
- `createInboundWebhookHandler({ provider?, domain?, db? })`: the `POST /api/webhooks/resend` handler (surface `webhook`). parseInbound (401 on a bad signature) → fetchInbound (503 on provider trouble, so Resend retries) → core `deliverInboundEmail`, which resolves `booking-<id>@MAIL_INBOUND_DOMAIN` to the booking and its organization and stores the mail as SYSTEM (`inboundEmail.receive`). Unknown addresses answer 200 (`mail.unmatched`); a redelivery is stored once.
- Attachments are base64 (`content`) with `filename` and optional `contentType`.

## Adapters
- `smtp` (default): nodemailer over `SMTP_URL`, Mailpit locally. No inbound (`UNAVAILABLE`).
- `resend`: REST `POST https://api.resend.com/emails` with `RESEND_API_KEY`; received mail from `GET /emails/receiving/{id}`. Inbound is the Svix-signed `email.received` webhook, verified with `RESEND_WEBHOOK_SECRET` (5 minute tolerance). The payload has metadata only; body and attachments are fetched from Resend by `providerEmailId`.
- Chosen by `MAIL_PROVIDER` in `@okazi/config`. `MAIL_PROVIDER=resend` without `RESEND_API_KEY` fails env validation.

## Tests
- `createMemoryMailProvider()` + `setMailProvider({ provider })`; restore with `setMailProvider({ provider: undefined })`.
- The SMTP adapter is tested against an in-process SMTP server (`test/fake-smtp-server.ts`), Resend with an injected `transport`. No network.
- `test/inbound-webhook.test.ts` posts a Svix-signed `email.received` fixture through the handler against the real database (`test/booking-fixture.ts` makes an organization with a booking).
