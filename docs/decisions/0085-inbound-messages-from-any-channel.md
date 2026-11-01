# 0085 – Inbound messages from any channel

- **Date:** 2026-11-01
- **Status:** Accepted (approved by the user on 2026-11-01)
- **Supersedes:** 0083 (organization inbox for email only; accepted, not built)
- **Amends:** 0012 (inbound mail stored as `InboundEmail`), 0084 (a draft is read from an inbound message of any channel)
- **Related:** 0081 (ticket intake), 0003 (parity), 0050 (permissions and API keys), 0051 (single source of truth), 0058 (external effects after commit), 0007 (AI proposes, the user confirms)

## Context
- Requests reach a venue in many ways:
  - mail to its booking address;
  - a short form on its own website;
  - a text message;
  - a partner system or another company's assistant calling Bibi's REST API or MCP server ("book a tasting for 14 on the 21st").
- ADR 0012 handles only mail to a ticket's own address, stored as `InboundEmail` with a required ticket. ADR 0083 (accepted, not built) added an organization address for email, still as `InboundEmail`.
- Building each channel with its own table, inbox, permissions and "new ticket from this …" would duplicate the receive path, the inbox, the matching to customers and tickets, and the draft extraction (ADR 0084) once per channel.
- The rule from ADR 0012 must hold for every channel. A message is recorded as what it is: no user and no AI can make something look like it arrived by mail, text or form.

## Decision
1. **One model for everything that comes in: `InboundMessage`.** Every channel stores into it. The fields that matter to every channel are normalised, all owned and append-only:
   - `channel`: `EMAIL | WEB_FORM | SMS | API`, a closed enum in code; a new channel is a code change.
   - `endpointId`: which of the organization's inbound endpoints received it (decision 2).
   - Sender as given, all optional: `fromName`, `fromEmail`, `fromPhone`.
   - `subject` (optional) and `text`, the readable body.
   - `formFields`: named values a channel delivers as structure, such as web form fields or an API caller's typed request. Validated per channel.
   - Attachments as metadata. The bytes stay with the provider or go to file storage (ADR 0063).
   - `externalId`: the provider's id. Unique per organization and channel, so a redelivery is stored once.
   - `receivedAt`, and `ticketId` (nullable, set once).
   - `details`: channel-specific extras, such as Message-ID and recipients for email or the provider message SID for SMS. Validated by the channel's Zod schema and never read outside that channel's adapter.
2. **Endpoints say where messages come in.** `InboundEndpoint` (organization data, `configuration:write`) holds:
   - `channel` and its address: the inbox mail address, a web form's public token, an SMS number, or an API key's id;
   - a name;
   - active or not;
   - optional defaults: a ticket type, or a package to suggest.

   Every organization gets one EMAIL endpoint, `<slug>@<MAIL_INBOUND_DOMAIN>` (ADR 0083 decision 1). A ticket's own address (`ticket-<id>@`) is not an endpoint: it is a reply route, and a message received there is stored with that ticket.
3. **Channel adapters live at the edge; core has one receive path.**
   - Each channel is an adapter in the app layer. It authenticates its provider (Svix signature for Resend, the SMS provider's signature, the form token plus spam guards, the API caller's key or OAuth grant). It maps the payload to the channel's input schema, resolves the endpoint and calls core.
   - Core has one SYSTEM-only command, `inboundMessage.receive({ endpointId, channel, … })`, with no user surface, the same as `inboundEmail.receive` today.
   - It stores the message, links it to its ticket when the adapter passes a reply hint (a ticket address, an email `In-Reply-To`, a reference in an SMS), and returns.
   - Side effects after commit (notifications, search indexing) follow ADR 0058.
4. **The API channel is the one inbound path a caller can use directly**, and it is recorded as `API`, never as mail.
   - `inboundMessage.submit({ endpointId, subject?, text, formFields? })` is a command with permission `inbox:submit`. It is meant for API keys and partner OAuth clients (ADR 0050).
   - It is on REST and MCP, so an outside system or an outside assistant can hand over a request.
   - It stores an `API` message with the caller as sender, and it creates no ticket.
   - It is not `aiAllowed` for Bibi's own assistant: our assistant drafts from messages (ADR 0084), it does not invent them.
5. **The inbox is every channel's messages without a ticket.** As in ADR 0083, these replace `inboundEmail.listInbox|attachToTicket|dismiss|restore`:
   - `inboundMessage.list` (by ticket, or the inbox: no ticket, not dismissed; filter by channel);
   - `inboundMessage.get`;
   - `inboundMessage.attachToTicket` (once);
   - `inboundMessage.dismiss` and `inboundMessage.restore`.

   Permissions: `inbox:read` and `inbox:write` (from ADR 0083), plus `inbox:submit`. A ticket's page lists its messages of every channel. "New ticket from this message" opens the intake (ADR 0081), and `ticket.create` takes `inboundMessageId`.
6. **Drafting works on any message** (amends ADR 0084). `ticketDraft.fromMessage` takes `{ text }` or `{ inboundMessageId }`:
   - Structured `formFields` that an endpoint maps to intake fields (date, guests, email, phone) are taken as given, quoted from the field and never marked guessed. Only free text goes to the model.
   - Customer and contact matching uses the sender's email domain or phone number.
7. **Mail moves to the general model with expand/contract** (ADR 0013).
   - Release one adds `InboundMessage` and `InboundEndpoint`. The mail adapter writes `EMAIL` messages, existing `InboundEmail` rows are backfilled into `InboundMessage` with the same ids, and reads switch to `InboundMessage`. `inboundEmail.list|get` stay as thin aliases that read `EMAIL` messages, so clients keep working.
   - A later release drops `InboundEmail` and the aliases.
8. **Adding a channel is an adapter, a details schema and an endpoint kind.** It needs no change to the model, the inbox, the permissions or the drafting. Each new channel still gets its own short spec: provider, authentication, spam handling, reply matching.
9. **Only EMAIL is built now** (the organization inbox and the ticket replies), together with `inboundMessage.submit` for the API channel, because it costs one command once the model exists. WEB_FORM and SMS are designed here and built later.

## Consequences
- The schema: `InboundMessage`, `InboundEndpoint`, the backfill from `InboundEmail`, and the `inbox` feature with read, write and submit. One EMAIL endpoint per organization, created at provisioning and in a migration for existing organizations.
- The mail webhook becomes the EMAIL adapter. Its behaviour is unchanged for ticket replies; mail to the organization address is now stored instead of dropped.
- Plan slice 8 becomes "inbound messages with the EMAIL channel". Slice 9 (the draft) reads `InboundMessage`.
- `ticket.create` takes `inboundMessageId` instead of `inboundEmailId` (ADR 0081 is updated when this is accepted).
- ADR 0083 is superseded. Its decisions survive here: the slug address, the stored inbox, attach once, dismiss, the inbox permissions and the reserved `ticket-` slugs.

## Alternatives rejected
- **One table per channel** (`InboundEmail`, `InboundSms`, `FormSubmission`). Rejected: three receive paths, three inboxes, and every ticket's history split across tables, for fields that are mostly the same.
- **Store the provider's raw payload only.** Rejected: every reader would have to understand every provider. Normalised fields plus a validated `details` keep the channels apart while the inbox, matching and drafting stay generic.
- **Let any user or Bibi's assistant create inbound messages.** Rejected: a message must be what it says it is (ADR 0012). Only adapters write their channel, and outside callers get their own, truthful `API` channel.
- **Open channels as ticket-creating endpoints** (a web form that creates a ticket directly). Rejected: spam and half-filled requests would become tickets. Every channel lands in the inbox, and a person creates the ticket (ADR 0007, 0081).
