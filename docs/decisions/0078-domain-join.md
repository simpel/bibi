# 0078 – Domain join, invite codes and a primary organization

- **Date:** 2026-11-01
- **Status:** Accepted
- **Related:** 0004 (organizations), 0050 (permissions), 0061 (welcome flow), 0072 (member contact)
- **Renumbered:** from 0076, which ADR 0076 (free status movement) also took. The `domain_join` migration's comments and commit d7eeeb52 still say 0076.

## Context
- A person gets into an organization only by invitation or by creating one. A venue with twenty staff means nineteen single invitations.
- Staff share a work email domain, and a verified address at that domain is good evidence someone works there.
- A claimed domain decides who may see an organization's orders and customers. A wrong claim lets strangers in, so who can claim matters more than the convenience.

## Decision
1. An organization has at most one email domain and a switch, on by default.
2. The domain is never typed in. It comes from someone who proved an address there: the creator at creation, or the admin who turns the switch on. Only verified emails count. Public mail providers never count.
3. Joining is offered, never forced. A user with a verified email at a claimed domain is offered the organization and joins as `member`, the lowest preset.
4. Never twice. `KnownMember` records everyone who has been a member, so someone removed or who left is not offered it again. A pending invitation wins over an offer.
5. Only an admin can turn the switch on or off (`member:write`).
6. Each domain join writes an `AuditLog` row with actor SYSTEM.
7. Every invitation gets a short unique code, valid only for the invited address while the invitation is pending.
8. After joining, the user picks a primary organization (`Member.primary`, at most one per user). New sessions start there.
9. Offering, joining, redeeming a code and choosing the primary run before the user is in an organization, so they are web actions, not org-scoped operations on every surface. The switch is an ordinary operation.

## Rejected
- The admin types the domain. Anyone could claim `worldofvolvo.com`.
- Verify the domain with a DNS record. Heavy for a first admin, and the creator's verified address gives the same evidence.
- Add silently on sign-in. The user lands in an organization they never chose.
- A reusable code per organization. Easy to leak; a per-invitation code is tied to one address.
- Offer removed members again. An admin could then never remove a colleague.
- Join with an unverified email. Anyone could register `ceo@worldofvolvo.com`.

## Consequences
- Two organizations may claim the same domain; the user picks.
- A consultant who creates an organization for a customer claims the consultant's domain, so settings shows the domain next to the switch.
- A creator with an unverified address claims nothing until they verify and turn it on.
- A migration backfills `emailDomain` from each organization's first admin's verified email, so existing organizations get domain join on.
