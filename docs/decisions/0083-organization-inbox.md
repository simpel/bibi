# 0083 – An organization inbox for mail that is not yet a ticket

- **Date:** 2026-11-01
- **Status:** Superseded by 0085 (accepted 2026-11-01, never built; its decisions live on in 0085 for every channel)
- **Amends:** 0012 (inbound mail only on a ticket's own address; other mail is dropped)
- **Related:** 0081 (ticket intake), 0084 (draft from a message), 0062 (organization slug), 0050 (permissions), 0058 (external effects after commit)

## Context
- Inbound mail works only on `ticket-<id>@<MAIL_INBOUND_DOMAIN>`. `InboundEmail.ticketId` is required. Mail to any other address answers 200, is logged as `mail.unmatched` and is dropped.
- Most requests reach a venue before any ticket exists: "a wine tasting for 14 on the 21st?" sent to the venue's booking address. Staff copy them into Bibi by hand.
- The intake flow (ADR 0081) can start from a message (ADR 0084). Pasting works anywhere, but a request that arrives in Bibi should be one click away from a ticket, and stay attached to it.
- ADR 0012's rule stays: no user or AI may fabricate a received mail.

## Decision
1. **Every organization gets one inbox address**, `<organization slug>@<MAIL_INBOUND_DOMAIN>` (slug from ADR 0062). The venue forwards its own booking address there, or publishes it. The address is shown in settings and copied from there. Slugs that start with `ticket-` are reserved, so the two schemes never collide.
2. **Mail to the inbox address is stored without a ticket.** `InboundEmail.ticketId` becomes nullable. `receive` (still SYSTEM only, still the only writer) routes by the recipient: a ticket address stores the mail on that ticket, as today; an organization address stores it in that organization with `ticketId` null. Mail to neither is still dropped and logged.
3. **The inbox is the organization's mail with no ticket that has not been dismissed.** Two owned columns record what staff did: `ticketId` (set once, when the mail is attached) and `dismissedAt` / `dismissedBy`. The mail itself stays append-only. Nothing is deleted.
4. **New operations:**
   - `inboundEmail.listInbox` (query; newest first; filter on dismissed).
   - `inboundEmail.attachToTicket({ id, ticketId })` (command). It sets `ticketId` once, and an attached mail cannot be moved. The ticket must be active and in the same organization.
   - `inboundEmail.dismiss({ id })` and `inboundEmail.restore({ id })` (commands).

   `ticket.create` takes an optional `inboundEmailId` and attaches the mail in the same transaction (ADR 0081).
5. **Permissions:** a new feature, `inbox` (`inbox:read`, `inbox:write`), because the inbox holds mail that is not tied to any ticket a member can already see.
   - Presets: member read and write, manager and admin the same.
   - `attachToTicket` also needs `ticket:write`.
   - The assistant may read the inbox and propose attach and dismiss. They are approval-gated commands, and `receive` stays invisible to it.
6. **The web app gets an Inbox page.** It lists unattached mail (sender, subject, received). Each mail has **New ticket from this email** (opens `/new/ticket?fromEmail=<id>`, step 0 of ADR 0081), **Attach to a ticket** and **Dismiss**. The body is shown as text; HTML is never rendered, as today.
7. **The size, attachment and redelivery rules are the same as for ticket mail.** Attachment bytes stay at the provider, and a redelivered webhook is stored once.

## Consequences
- Migration:
  - `InboundEmail.ticketId` nullable;
  - `dismissedAt` and `dismissedBy`;
  - an index on `(organizationId, ticketId, dismissedAt, receivedAt)` for the inbox list;
  - slug validation that reserves `ticket-`.
- `inboundEmail.list` for a ticket is unchanged. The derived `Ticket.inboundAddress` is unchanged, and organization settings show the inbox address.
- New permission feature `inbox`. Approval labels, isolation tests and parity on every surface.
- The demo seed stores a few inbox mails, one of them the wine tasting request used by flow C.

## Alternatives rejected
- **A separate `InboxMessage` table.** Rejected: the same mail, the same webhook and the same fields. A second table would duplicate the receive path and split a ticket's mail history in two.
- **Creating a ticket automatically for every mail.** Rejected: spam and newsletters would become leads. Staff decide, and the assistant only drafts (ADR 0084).
- **Reading the venue's mailbox (IMAP or Gmail API).** Rejected for now: credentials per venue and a sync engine. Forwarding to one address gives the same result with the existing webhook.
- **Using `ticket:read` for the inbox.** Rejected: inbox mail belongs to no ticket yet, and some members should see tickets without seeing every request that arrives.
