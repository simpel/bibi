import type { ExecuteContext } from "@okazi/core";
import { getDb } from "@okazi/db";
import { createId } from "@paralleldrive/cuid2";

export type SeedOrgMemberInput = { context: ExecuteContext };

/**
 * Better Auth rows the access entities need: the `organization` (roles have a foreign key to
 * it), the caller's user row (the inviter of `member.invite`) and one member to assign a role
 * to (there is no `member.create` operation).
 */
export async function seedOrgMember({ context }: SeedOrgMemberInput): Promise<{ id: string }> {
  const { organizationId } = context;
  const db = getDb();
  await db.organization.create({
    data: { id: organizationId, name: organizationId, slug: organizationId, createdAt: new Date() },
  });
  const callerId = context.actor.userId;
  if (callerId) {
    const email = `${callerId}@x.test`;
    await db.user.upsert({
      where: { id: callerId },
      create: { id: callerId, name: "Parity Caller", email },
      update: {},
    });
  }
  const userId = `user_${createId()}`;
  await db.user.create({ data: { id: userId, name: "Parity Person", email: `${userId}@x.test` } });
  const id = `member_${createId()}`;
  await db.member.create({
    data: { id, organizationId, userId, role: "New", createdAt: new Date() },
  });
  return { id };
}
