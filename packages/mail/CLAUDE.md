# @okazi/mail – context for Claude

Email behind one interface (ADR 0012). The only package that talks to nodemailer or Resend.

## API
- `sendMail({ to, subject, text, html?, replyTo?, attachments? })` → `Result<SentMail>`. Validates with `MailMessageSchema`, sends through `getMailProvider()`, logs `mail.sent` (with `provider`, masked `recipient`, `subject`, `durationMs`) or `mail.failed`. Never logs the body.
- `MailProvider`: `send({ message })` and `parseInbound({ request: { headers, body } })`. `parseInbound` returns `null` for webhook events that are not received mail.
- Attachments are base64 (`content`) with `filename` and optional `contentType`.

## Adapters
- `smtp` (default): nodemailer over `SMTP_URL`, Mailpit locally. No inbound (`UNAVAILABLE`).
- `resend`: REST `POST https://api.resend.com/emails` with `RESEND_API_KEY`. Inbound is the Svix-signed `email.received` webhook, verified with `RESEND_WEBHOOK_SECRET` (5 minute tolerance). The payload has metadata only; body and attachments are fetched from Resend by `providerEmailId`.
- Chosen by `MAIL_PROVIDER` in `@okazi/config`. `MAIL_PROVIDER=resend` without `RESEND_API_KEY` fails env validation.

## Tests
- `createMemoryMailProvider()` + `setMailProvider({ provider })`; restore with `setMailProvider({ provider: undefined })`.
- The SMTP adapter is tested against an in-process SMTP server (`test/fake-smtp-server.ts`), Resend with an injected `transport`. No network.
