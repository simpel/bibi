# 0083 – An organization inbox for mail that is not yet an order

- **Date:** 2026-11-01
- **Status:** Superseded by 0085 (accepted 2026-11-01, never built; its decisions live on in 0085 for every channel)
- **Amends:** 0012 (inbound mail only on an order's own address; other mail is dropped)
- **Related:** 0081 (order intake), 0084 (draft from a message), 0062 (organization slug), 0050 (permissions), 0058 (external effects after commit)

## Context
- Inbound mail works only on `order-<id>@<MAIL_INBOUND_DOMAIN>`. `InboundEmail.orderId` is required. Mail to any other address answers 200, is logged as `mail.unmatched` and is dropped.
- Most requests reach a venue before any order exists: "a wine tasting for 14 on the 21st?" sent to the venue's booking address. Staff copy them into Bibi by hand.
- The intake flow (ADR 0081) can start from a message (ADR 0084). Pasting works anywhere, but a request that arrives in Bibi should be one click away from an order, and stay attached to it.
- ADR 0012's rule stays: no user or AI may fabricate a received mail.

## Decision
1. **Every organization gets one inbox address**, `<organization slug>@<MAIL_INBOUND_DOMAIN>` (slug from ADR 0062). The venue forwards its own booking address there, or publishes it. The address is shown in settings and copied from there. Slugs that start with `order-` are reserved, so the two schemes never collide.
2. **Mail to the inbox address is stored without an order.** `InboundEmail.orderId` becomes nullable. `receive` (still SYSTEM only, still the only writer) routes by the recipient: an order address stores the mail on that order, as today; an organization address stores it in that organization with `orderId` null. Mail to neither is still dropped and logged.
3. **The inbox is the organization's mail with no order that has not been dismissed.** Two owned columns record what staff did: `orderId` (set once, when the mail is attached) and `dismissedAt` / `dismissedBy`. The mail itself stays append-only. Nothing is deleted.
4. **New operations:**
   - `inboundEmail.listInbox` (query; newest first; filter on dismissed).
   - `inboundEmail.attachToOrder({ id, orderId })` (command). It sets `orderId` once, and an attached mail cannot be moved. The order must be active and in the same organization.
   - `inboundEmail.dismiss({ id })` and `inboundEmail.restore({ id })` (commands).

   `order.create` takes an optional `inboundEmailId` and attaches the mail in the same transaction (ADR 0081).
5. **Permissions:** a new feature, `inbox` (`inbox:read`, `inbox:write`), because the inbox holds mail that is not tied to any order a member can already see.
   - Presets: member read and write, manager and admin the same.
   - `attachToOrder` also needs `order:write`.
   - The assistant may read the inbox and propose attach and dismiss. They are approval-gated commands, and `receive` stays invisible to it.
6. **The web app gets an Inbox page.** It lists unattached mail (sender, subject, received). Each mail has **New order from this email** (opens `/new/order?fromEmail=<id>`, step 0 of ADR 0081), **Attach to an order** and **Dismiss**. The body is shown as text; HTML is never rendered, as today.
7. **The size, attachment and redelivery rules are the same as for order mail.** Attachment bytes stay at the provider, and a redelivered webhook is stored once.

## Consequences
- Migration:
  - `InboundEmail.orderId` nullable;
  - `dismissedAt` and `dismissedBy`;
  - an index on `(organizationId, orderId, dismissedAt, receivedAt)` for the inbox list;
  - slug validation that reserves `order-`.
- `inboundEmail.list` for an order is unchanged. The derived `Order.inboundAddress` is unchanged, and organization settings show the inbox address.
- New permission feature `inbox`. Approval labels, isolation tests and parity on every surface.
- The demo seed stores a few inbox mails, one of them the wine tasting request used by flow C.

## Alternatives rejected
- **A separate `InboxMessage` table.** Rejected: the same mail, the same webhook and the same fields. A second table would duplicate the receive path and split an order's mail history in two.
- **Creating an order automatically for every mail.** Rejected: spam and newsletters would become leads. Staff decide, and the assistant only drafts (ADR 0084).
- **Reading the venue's mailbox (IMAP or Gmail API).** Rejected for now: credentials per venue and a sync engine. Forwarding to one address gives the same result with the existing webhook.
- **Using `order:read` for the inbox.** Rejected: inbox mail belongs to no order yet, and some members should see orders without seeing every request that arrives.
