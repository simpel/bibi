import type { Db } from "@okazi/db";
import type { DemoOrg } from "./types";
import { demoEmailDomain } from "./users";

export type ResetDemoOrgInput = { db: Db; org: DemoOrg };

/**
 * Deletes one demo organization and everything it owns, so the seed can recreate it (ADR 0019:
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
      db.room.deleteMany({ where }),
      db.venue.deleteMany({ where }),
      db.skill.deleteMany({ where }),
      db.embedding.deleteMany({ where }),
      db.auditLog.deleteMany({ where }),
      db.organization.delete({ where: { id: existing.id } }),
    ]);
  }
  await db.user.deleteMany({ where: { email: { endsWith: `@${demoEmailDomain({ org })}` } } });
}
