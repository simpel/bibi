# 0078 – Domain join, invite codes and a primary organization

- **Date:** 2026-11-01
- **Status:** Accepted
- **Related:** 0004 (organizations), 0050 (permissions), 0061 (welcome flow), 0072 (member contact)
- **Renumbered:** from 0076, which ADR 0076 (free status movement) also took. The `domain_join` migration's comments and commit d7eeeb52 still say 0076.

## Context
- Today a person gets into an organization only by invitation, or by creating one (ADR 0061). At a venue with twenty staff, the first admin invites nineteen people one by one.
- Staff at a venue share a work email domain (`worldofvolvo.com`). An address at that domain is good evidence that someone works there, once they have proved they own the address.
- An organization that claims a domain decides who may see its tickets and customers. A wrong claim lets strangers in, so who can claim a domain and which addresses count matters more than the convenience.

## Decision
1. **An organization has at most one email domain** (`OrganizationProfile.emailDomain`, owned, lowercase) **and a switch** (`domainJoin`, owned, on by default).
2. **The domain is never typed in.** It comes from someone who proved they have an address there:
   - At creation it is the creator's email domain (`afterCreateOrganization`).
   - When an admin turns domain join on, it becomes that admin's own email domain, else the stored one stays. So an admin at the venue can replace a domain the creator brought in.
   - Only a **verified** email counts. Public mail providers (`gmail.com`, `outlook.com`, …, core `PUBLIC_EMAIL_DOMAINS`) never count.
3. **Offered, never forced.** A user with a verified email at a claimed domain is *offered* every organization that claims it with the switch on; nobody is added without clicking. On `/welcome` the first offer is a step: "Join <organization>", with a ghost button "Join a different organization" under it. Joining makes them a **`member`**, the lowest preset (ADR 0050); an admin raises the role.
4. **Never twice.** `KnownMember` (append-only, org-scoped) records every user who has been a member: written by domain join, by Better Auth's `afterAddMember` and `afterAcceptInvitation`, by domain join when it finds an existing member, and backfilled for today's members. Domain join never offers an organization to a user with a row, so someone removed or who left stays out until invited. A user with a pending invitation is not offered it either: the invitation's role wins.
5. **Admin only.** `organizationProfile.setDomainJoin({ enabled })` needs `member:write`, which is locked to the admin preset: it decides who becomes a member. It is exposed in web (`/settings/organization`), GraphQL, REST and MCP like any command (ADR 0003).
6. **Logged and audited.** Each domain join writes an `AuditLog` row (`member.joinByDomain`, actor SYSTEM) in the organization and the log event `auth.domainJoined`.
7. **Invite codes.** Every invitation (`member.invite`) gets a short code (`Invitation.code`, 8 characters, unique), printed in the invitation email next to the link. "Join a different organization" asks for it. A code is accepted only for the invited email address, while the invitation is pending and unexpired, through Better Auth's `acceptInvitation` (same role and hooks as the link).
8. **One page to join.** After a join or a code, `/welcome/organizations` lists every organization the user can join (domain offers and pending invitations, each with Join) and the ones they belong to (ticked). They pick a **primary organization** and continue into it.
9. **Primary organization.** `Member.primary` (owned, at most one per user, partial unique index) marks it. A new session starts there (`defaultActiveOrganization`), else in the oldest membership as before.
10. **Where it runs.** Offering, joining, redeeming a code and choosing the primary happen before the user is in an organization, so they are web actions over `packages/auth` and core helpers, like accepting an invitation (ADR 0061), not org-scoped operations in GraphQL, REST and MCP. The switch (decision 5) is an ordinary operation.

## Consequences
- One organization's failure never keeps the user out of the others, and a failed contact prefill (ADR 0072) never undoes a join.
- A migration adds the two columns and the table, backfills `KnownMember` from today's members, and backfills `emailDomain` for existing organizations from their first admin's verified email, skipping public providers. Existing organizations therefore get domain join on (the default).
- A creator who signs up with a password and has not verified the address yet claims no domain; they turn it on in settings once verified.
- Two organizations may claim the same domain (two venues of one company). A user at that domain is offered both and picks.
- A consultant who creates an organization for a customer claims the consultant's domain. Settings shows the domain next to the switch so the admin sees it and can turn it off.
- A user who already belongs to an organization is not stopped by a new offer at sign-in; `/welcome` lists it.

## Rejected
- **The admin types the domain.** Anyone could claim `worldofvolvo.com` and collect its staff as they sign up.
- **Verify domain ownership with a DNS record.** Safer for a typed domain, but heavy for a venue's first admin, and the creator's verified address gives the same evidence for the common case.
- **Add silently on sign-in.** Simpler, but someone at a shared domain lands in an organization they never chose, and they never see the choice of primary organization.
- **A reusable code per organization.** Easy to share, and as easy to leak; a per-invitation code is tied to one address.
- **Offer removed members again.** An admin could then never remove a colleague.
- **Join with an unverified email.** Password sign-up does not verify the address, so anyone could register `ceo@worldofvolvo.com`.
