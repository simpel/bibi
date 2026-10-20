import { getDb } from "@okazi/db";
import { createId } from "@paralleldrive/cuid2";
import type { ExecuteContext, PermissionSet } from "../src/index";
import { type TestAccess, testContext } from "./helpers";

export type TestOrgInput = { access?: TestAccess; permissions?: PermissionSet };

/**
 * `testContext()` plus a real `organization` row: roles and members have a foreign key to it
 * (Better Auth tables), unlike business rows.
 */
export async function testOrg({ access, permissions }: TestOrgInput = {}): Promise<ExecuteContext> {
  const context = testContext({
    ...(access ? { access } : {}),
    ...(permissions ? { permissions } : {}),
  });
  const id = context.organizationId;
  await getDb().organization.create({
    data: { id, name: id, slug: id, createdAt: new Date() },
  });
  return context;
}

export type AddTestMemberInput = { context: ExecuteContext; role: string; name?: string };

/** A user + membership row, like Better Auth's `addMember` writes it. Returns the member id. */
export async function addTestMember({ context, role, name }: AddTestMemberInput): Promise<string> {
  return (await addTestMemberWithUser({ context, role, ...(name ? { name } : {}) })).memberId;
}

/** Like `addTestMember`, but also returns the user id (what assignments refer to). */
export async function addTestMemberWithUser({
  context,
  role,
  name = "Test Person",
}: AddTestMemberInput): Promise<{ memberId: string; userId: string }> {
  const userId = `user_${createId()}`;
  await getDb().user.create({
    data: { id: userId, name, email: `${userId}@example.test`, emailVerified: true },
  });
  const memberId = `member_${createId()}`;
  await getDb().member.create({
    data: {
      id: memberId,
      organizationId: context.organizationId,
      userId,
      role,
      createdAt: new Date(),
    },
  });
  return { memberId, userId };
}
