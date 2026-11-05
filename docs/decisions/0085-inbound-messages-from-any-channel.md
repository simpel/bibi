# 0085 – Inbound messages from any channel

- **Date:** 2026-11-01
- **Status:** Accepted (approved by the user on 2026-11-01)
- **Amended:** 2026-11-03 (read and unread, and delete, replace dismiss; see Addendum)
- **Supersedes:** 0083 (organization inbox for email only; accepted, not built)
- **Amends:** 0012 (inbound mail stored as `InboundEmail`), 0084 (a draft is read from an inbound message of any channel)
- **Related:** 0081 (order intake), 0003 (parity), 0050 (permissions and API keys), 0051 (single source of truth), 0058 (external effects after commit), 0007 (AI proposes, the user confirms)

## Context
- Requests reach a venue in many ways:
  - mail to its booking address;
  - a short form on its own website;
  - a text message;
  - a partner system or another company's assistant calling Bibi's REST API or MCP server ("book a tasting for 14 on the 21st").
- ADR 0012 handles only mail to an order's own address, stored as `InboundEmail` with a required order. ADR 0083 (accepted, not built) added an organization address for email, still as `InboundEmail`.
- Building each channel with its own table, inbox, permissions and "new order from this …" would duplicate the receive path, the inbox, the matching to customers and orders, and the draft extraction (ADR 0084) once per channel.
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
   - `receivedAt`, and `orderId` (nullable, set once).
   - `details`: channel-specific extras, such as Message-ID and recipients for email or the provider message SID for SMS. Validated by the channel's Zod schema and never read outside that channel's adapter.
2. **Endpoints say where messages come in.** `InboundEndpoint` (organization data, `configuration:write`) holds:
   - `channel` and its address: the inbox mail address, a web form's public token, an SMS number, or an API key's id;
   - a name;
   - active or not;
   - optional defaults: an order type, or a package to suggest.

   Every organization gets one EMAIL endpoint, `<slug>@<MAIL_INBOUND_DOMAIN>` (ADR 0083 decision 1). An order's own address (`order-<id>@`) is not an endpoint: it is a reply route, and a message received there is stored with that order.
3. **Channel adapters live at the edge; core has one receive path.**
   - Each channel is an adapter in the app layer. It authenticates its provider (Svix signature for Resend, the SMS provider's signature, the form token plus spam guards, the API caller's key or OAuth grant). It maps the payload to the channel's input schema, resolves the endpoint and calls core.
   - Core has one SYSTEM-only command, `inboundMessage.receive({ endpointId, channel, … })`, with no user surface, the same as `inboundEmail.receive` today.
   - It stores the message, links it to its order when the adapter passes a reply hint (an order address, an email `In-Reply-To`, a reference in an SMS), and returns.
   - Side effects after commit (notifications, search indexing) follow ADR 0058.
4. **The API channel is the one inbound path a caller can use directly**, and it is recorded as `API`, never as mail.
   - `inboundMessage.submit({ endpointId, subject?, text, formFields? })` is a command with permission `inbox:submit`. It is meant for API keys and partner OAuth clients (ADR 0050).
   - It is on REST and MCP, so an outside system or an outside assistant can hand over a request.
   - It stores an `API` message with the caller as sender, and it creates no order.
   - It is not `aiAllowed` for Bibi's own assistant: our assistant drafts from messages (ADR 0084), it does not invent them.
5. **The inbox is every channel's messages without an order.** As in ADR 0083, these replace `inboundEmail.listInbox|attachToOrder|dismiss|restore`:
   - `inboundMessage.list` (by order, or the inbox: no order; filter by channel and by read);
   - `inboundMessage.get`;
   - `inboundMessage.attachToOrder` (once);
   - `inboundMessage.markRead`, `inboundMessage.markUnread` and `inboundMessage.delete` (Addendum; they replace `dismiss` and `restore`).

   Permissions: `inbox:read`, `inbox:write` and `inbox:delete` (from ADR 0083, `delete` from the Addendum), plus `inbox:submit`. An order's page lists its messages of every channel. "New order from this message" opens the intake (ADR 0081), and `order.create` takes `inboundMessageId`.
6. **Drafting works on any message** (amends ADR 0084). `orderDraft.fromMessage` takes `{ text }` or `{ inboundMessageId }`:
   - Structured `formFields` that an endpoint maps to intake fields (date, guests, email, phone) are taken as given, quoted from the field and never marked guessed. Only free text goes to the model.
   - Customer and contact matching uses the sender's email domain or phone number.
7. **Mail moves to the general model with expand/contract** (ADR 0013).
   - Release one adds `InboundMessage` and `InboundEndpoint`. The mail adapter writes `EMAIL` messages, existing `InboundEmail` rows are backfilled into `InboundMessage` with the same ids, and reads switch to `InboundMessage`. `inboundEmail.list|get` stay as thin aliases that read `EMAIL` messages, so clients keep working.
   - A later release drops `InboundEmail` and the aliases.
8. **Adding a channel is an adapter, a details schema and an endpoint kind.** It needs no change to the model, the inbox, the permissions or the drafting. Each new channel still gets its own short spec: provider, authentication, spam handling, reply matching.
9. **Only EMAIL is built now** (the organization inbox and the order replies), together with `inboundMessage.submit` for the API channel, because it costs one command once the model exists. WEB_FORM and SMS are designed here and built later.

## Consequences
- The schema: `InboundMessage`, `InboundEndpoint`, the backfill from `InboundEmail`, and the `inbox` feature with read, write and submit. One EMAIL endpoint per organization, created at provisioning and in a migration for existing organizations.
- The mail webhook becomes the EMAIL adapter. Its behaviour is unchanged for order replies; mail to the organization address is now stored instead of dropped.
- Plan slice 8 becomes "inbound messages with the EMAIL channel". Slice 9 (the draft) reads `InboundMessage`.
- `order.create` takes `inboundMessageId` instead of `inboundEmailId` (ADR 0081 is updated when this is accepted).
- ADR 0083 is superseded. Its decisions survive here: the slug address, the stored inbox, attach once, dismiss, the inbox permissions and the reserved `order-` slugs.

## Alternatives rejected
- **One table per channel** (`InboundEmail`, `InboundSms`, `FormSubmission`). Rejected: three receive paths, three inboxes, and every order's history split across tables, for fields that are mostly the same.
- **Store the provider's raw payload only.** Rejected: every reader would have to understand every provider. Normalised fields plus a validated `details` keep the channels apart while the inbox, matching and drafting stay generic.
- **Let any user or Bibi's assistant create inbound messages.** Rejected: a message must be what it says it is (ADR 0012). Only adapters write their channel, and outside callers get their own, truthful `API` channel.
- **Open channels as order-creating endpoints** (a web form that creates an order directly). Rejected: spam and half-filled requests would become orders. Every channel lands in the inbox, and a person creates the order (ADR 0007, 0081).

## Addendum 2026-11-03: read and unread, and delete, replace dismiss
- **Why:** dismiss mixed two jobs. Staff wanted to see what the team has already looked at, and to get rid of spam. Dismiss did half of each: a dismissed message was neither clearly read nor gone.
- **Read state is shared by the team.** `InboundMessage.readAt` and `readBy` (owned) are one flag per message, not per member: the inbox is shared work (ADR 0094 keeps personal read state for notifications). `inboundMessage.markRead` and `markUnread` (`inbox:write`) set and clear it. Opening a message in the app marks it read.
- **The inbox shows unread first.** `inboundMessage.list` takes `read` (true, false or absent for both); the web inbox lists the unread messages in one table and the read ones in a second table below it. `inboundMessage.openCount`, the sidebar badge, counts unread messages without an order.
- **Delete archives.** `inboundMessage.delete` (`inbox:delete`, new action on the `inbox` feature) sets `status = ARCHIVED`, as everywhere in Bibi (ADR 0006): the row is kept and hidden from every read. Only a message without an order can be deleted (`CONFLICT` otherwise). Every preset that worked the inbox gets `inbox:delete`, as it had dismiss.
- **Migration:** a dismissed message became a read one (`readAt = dismissedAt`, `readBy = dismissedBy`); `dismissedAt`, `dismissedBy`, `dismiss`, `restore` and the Dismissed view are gone.
- **Rejected:** a per-member read state. It would make every member clear the same queue, and nobody could see that a colleague already handled a message.
