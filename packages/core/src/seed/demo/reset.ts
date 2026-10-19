import type { Db } from "@okazi/db";
import type { DemoOrg } from "./types";
import { demoEmailDomain } from "./users";

export type ResetDemoOrgInput = { db: Db; org: DemoOrg };

type ScopeInput = { db: Db; where: { organizationId: string } };

/**
 * What hangs off a ticket (ADR 0043), children first; deleted before the items they use. The
 * predefined tickets use items, setups and types, so they go here too.
 */
const ticketChildren = ({ db, where }: ScopeInput) => [
  db.inboundEmail.deleteMany({ where }),
  db.payment.deleteMany({ where }),
  db.sheet.deleteMany({ where }),
  db.requirement.deleteMany({ where }),
  db.line.deleteMany({ where }),
  db.ticketTemplateLine.deleteMany({ where }),
  db.ticketTemplate.deleteMany({ where }),
  db.orderLine.deleteMany({ where }),
  db.quote.deleteMany({ where }),
];

/** Item states, their transitions and the phase grid (ADR 0044); after the lines that use them. */
const itemStates = ({ db, where }: ScopeInput) => [
  db.phaseStateRule.deleteMany({ where }),
  // A type's expiry state points back at its states: cut that link before deleting either.
  db.entityType.updateMany({ where, data: { expiryStateId: null } }),
  db.itemStateTransition.deleteMany({ where }),
  db.itemState.deleteMany({ where }),
];

/**
 * Deletes one demo organization and everything it owns, so the seed can recreate it (ADR 0025:
 * idempotent per slug). Business rows have no FK to `organization` and are deleted explicitly,
 * children first; Better Auth rows (members, roles, invitations) cascade with the organization.
 */
export async function resetDemoOrg({ db, org }: ResetDemoOrgInput): Promise<void> {
  const existing = await db.organization.findFirst({ where: { slug: org.slug } });
  if (existing) {
    const where = { organizationId: existing.id };
    await db.$transaction([
      db.message.deleteMany({ where }),
      db.conversation.deleteMany({ where }),
      ...ticketChildren({ db, where }),
      ...itemStates({ db, where }),
      db.priceListItem.deleteMany({ where }),
      db.priceList.deleteMany({ where }),
      db.itemComponent.deleteMany({ where }),
      db.itemChoiceGroup.deleteMany({ where }),
      db.itemSetup.deleteMany({ where }),
      db.occupancy.deleteMany({ where }),
      db.item.deleteMany({ where }),
      db.assignmentFollower.deleteMany({ where }),
      db.assignment.deleteMany({ where }),
      db.ticket.deleteMany({ where }),
      db.ticketPhaseTransition.deleteMany({ where }),
      db.ticketPhase.deleteMany({ where }),
      db.contact.deleteMany({ where }),
      db.customer.deleteMany({ where }),
      db.fieldDefinition.deleteMany({ where }),
      db.vocabularyValue.deleteMany({ where }),
      db.vocabulary.deleteMany({ where }),
      db.responsibility.deleteMany({ where }),
      db.setup.deleteMany({ where }),
      db.entityType.deleteMany({ where }),
      db.venue.deleteMany({ where }),
      db.skill.deleteMany({ where }),
      db.embedding.deleteMany({ where }),
      db.auditLog.deleteMany({ where }),
      db.organization.delete({ where: { id: existing.id } }),
    ]);
  }
  await db.user.deleteMany({ where: { email: { endsWith: `@${demoEmailDomain({ org })}` } } });
}
