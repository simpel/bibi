# 0085 – Inbound messages from any channel

- **Date:** 2026-11-01
- **Status:** Accepted
- **Amended:** 2026-11-03 (read, unread and delete replace dismiss)
- **Supersedes:** 0083
- **Amends:** 0012, 0084
- **Related:** 0081, 0003, 0050, 0051, 0058, 0007

## Context
- Requests reach a venue by mail, a web form, text message, or a partner system calling the REST API or MCP.
- ADR 0012 stored only mail to an order's own address, as `InboundEmail`. One table, inbox and draft path per channel would be duplicated several times.
- The rule from ADR 0012 must hold for every channel: a message is recorded as what it is, and no user or AI can fake a channel.

## Decision
1. One model, `InboundMessage`, for everything that comes in. Common fields are normalised, owned and append-only: channel (`EMAIL | WEB_FORM | SMS | API`, a closed enum), endpoint, sender, subject, text, structured form fields, attachment metadata, provider id (unique per organization and channel, so redelivery is stored once), received time and an optional order set once. Channel extras live in a validated `details`.
2. `InboundEndpoint` (organization data) says where messages arrive. Every organization gets one EMAIL endpoint at `<slug>@<MAIL_INBOUND_DOMAIN>`. An order's own address is a reply route, not an endpoint.
3. Adapters live at the edge and authenticate their provider. Core has one SYSTEM-only command, `inboundMessage.receive`, with no user surface.
4. The API channel is the one path a caller can use directly. `inboundMessage.submit` needs `inbox:submit`, is for API keys and partner OAuth clients, stores an `API` message and creates no order. Bibi's own assistant may not use it.
5. The inbox is every channel's messages without an order. Operations: `list`, `get`, `attachToOrder` (once), `markRead`, `markUnread` and `delete`. Permissions: `inbox:read`, `write`, `delete` and `submit`.
6. Drafting works on any message (amends ADR 0084). Structured fields an endpoint maps to intake fields are taken as given; only free text goes to the model.
7. Mail moves to the general model with expand and contract (ADR 0013): add the tables, backfill `InboundEmail` with the same ids, keep thin aliases, drop the old table later.
8. A new channel is an adapter, a details schema and an endpoint kind, with its own short spec.
9. Only EMAIL and `submit` are built. WEB_FORM and SMS are designed, not built.

Addendum 2026-11-03: read state is one shared flag per message (`readAt`, `readBy`), because the inbox is shared work. `delete` archives, as everywhere (ADR 0006), and only for a message without an order. A dismissed message became a read one.

## Rejected
- One table per channel. Three receive paths and inboxes, and order history split across tables, for mostly the same fields.
- Store the provider's raw payload only. Every reader would need to understand every provider.
- Let any user or the assistant create inbound messages. A message must be what it says it is. Outside callers get the truthful `API` channel.
- Channels that create orders directly. Spam and half-filled requests would become orders; a person creates the order.
- A per-member read state. Every member would clear the same queue.

## Consequences
- Schema: `InboundMessage`, `InboundEndpoint`, the backfill and the `inbox` feature.
- Mail to the organization address is stored instead of dropped.
- `order.create` takes `inboundMessageId`.
- ADR 0083 decisions survive here: slug address, attach once, reserved `order-` slugs.
