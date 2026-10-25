import type { Db } from "@bibi/db";

export type DeleteOrganizationsInput = { db: Db; organizationIds: string[] };

type ScopeInput = { db: Db; where: { organizationId: { in: string[] } } };

/**
 * What hangs off a ticket (ADR 0043), children first; deleted before the items they use. The
 * predefined tickets use items, setups and types, so they go here too.
 */
const ticketChildren = ({ db, where }: ScopeInput) => [
  db.inboundEmail.deleteMany({ where }),
  // Payments settle quotes, deposits and invoices (ADR 0057): before all three.
  db.payment.deleteMany({ where }),
  db.deposit.deleteMany({ where }),
  db.sheet.deleteMany({ where }),
  db.requirement.deleteMany({ where }),
  // Order lines point at the lines they froze and at their quote or invoice (ADR 0052).
  db.orderLine.deleteMany({ where }),
  db.invoice.deleteMany({ where }),
  db.quote.deleteMany({ where }),
  // A chosen alternative points at its line and the lines at their group (ADR 0052).
  db.alternativeGroup.updateMany({ where, data: { chosenLineId: null } }),
  // The status and state history (ADR 0054) points at the lines, tickets, statuses and states.
  db.lineStateChange.deleteMany({ where }),
  db.ticketStatusChange.deleteMany({ where }),
  // Allocations point at their lines, demands and each other (ADR 0059); their holds cascade.
  db.lineAllocation.updateMany({ where, data: { parentAllocationId: null } }),
  db.lineAllocation.deleteMany({ where }),
  // A part line points at its bundle line (ADR 0059): cut that link before deleting either.
  db.line.updateMany({ where, data: { parentLineId: null } }),
  db.line.deleteMany({ where }),
  db.alternativeGroup.deleteMany({ where }),
  db.ticketTemplateLine.deleteMany({ where }),
  db.ticketTemplate.deleteMany({ where }),
];

/** Item states, their transitions and the status grid (ADR 0044); after the lines that use them. */
const itemStates = ({ db, where }: ScopeInput) => [
  db.statusStateRule.deleteMany({ where }),
  // A type's expiry state points back at its states: cut that link before deleting either.
  db.entityType.updateMany({ where, data: { expiryStateId: null } }),
  db.itemStateTransition.deleteMany({ where }),
  db.itemState.deleteMany({ where }),
];

/**
 * Sheet definitions and the id lists of definitions and responsibilities (ADR 0056); after the
 * sheet versions, before the responsibilities, types, fields and lists they point at.
 */
const configLinks = ({ db, where }: ScopeInput) => [
  db.sheetDefinitionEntityType.deleteMany({ where }),
  db.sheetDefinitionField.deleteMany({ where }),
  db.sheetDefinitionVocabulary.deleteMany({ where }),
  db.sheetDefinition.deleteMany({ where }),
  db.responsibilityEntityType.deleteMany({ where }),
  db.responsibilityDefaultFollower.deleteMany({ where }),
];

/** What an item owns besides its record (ADR 0021, 0059); after the allocations and lines. */
const itemChildren = ({ db, where }: ScopeInput) => [
  db.itemDemandTag.deleteMany({ where }),
  db.itemDemand.deleteMany({ where }),
  db.itemPart.deleteMany({ where }),
  db.itemCustomisationGroup.deleteMany({ where }),
  db.itemSetup.deleteMany({ where }),
  // Hours patterns of items and venues (ADR 0064): before both.
  db.hoursException.deleteMany({ where }),
  db.hoursDay.deleteMany({ where }),
  // Member profiles link to staff items (ADR 0068): before the items.
  db.memberProfileItem.deleteMany({ where }),
  db.memberProfile.deleteMany({ where }),
];

/** Contacts, customers and the `Record` supertable rows (ADR 0056), after every table that extends them. */
const recordRoots = ({ db, where }: ScopeInput) => [
  db.recordLink.deleteMany({ where }),
  db.contact.deleteMany({ where }),
  db.customer.deleteMany({ where }),
  db.record.deleteMany({ where }),
];

/**
 * Deletes organizations and everything they own, in one transaction. Business rows have no FK
 * to `organization` and are deleted explicitly, children first; Better Auth rows (members,
 * roles, invitations) cascade with the organization. Used by the demo seed's reset (ADR 0025)
 * and the opt-in `cleanup:test-orgs` script; never by application code.
 */
export async function deleteOrganizations({
  db,
  organizationIds,
}: DeleteOrganizationsInput): Promise<void> {
  if (organizationIds.length === 0) return;
  const where = { organizationId: { in: organizationIds } };
  await db.$transaction([
    db.embedding.deleteMany({ where }),
    db.message.deleteMany({ where }),
    db.conversation.deleteMany({ where }),
    ...ticketChildren({ db, where }),
    ...itemStates({ db, where }),
    ...configLinks({ db, where }),
    db.priceListItem.deleteMany({ where }),
    db.priceList.deleteMany({ where }),
    ...itemChildren({ db, where }),
    db.occupancy.deleteMany({ where }),
    db.item.deleteMany({ where }),
    db.assignmentFollower.deleteMany({ where }),
    db.assignment.deleteMany({ where }),
    db.ticket.deleteMany({ where }),
    db.ticketStatusTransition.deleteMany({ where }),
    db.ticketStatus.deleteMany({ where }),
    ...recordRoots({ db, where }),
    db.fieldDefinition.deleteMany({ where }),
    db.vocabularyValue.deleteMany({ where }),
    db.vocabulary.deleteMany({ where }),
    db.permissionOverride.deleteMany({ where }),
    db.responsibility.deleteMany({ where }),
    db.setup.deleteMany({ where }),
    db.entityType.deleteMany({ where }),
    db.venue.deleteMany({ where }),
    db.skill.deleteMany({ where }),
    db.auditLog.deleteMany({ where }),
    db.organization.deleteMany({ where: { id: { in: organizationIds } } }),
  ]);
}
