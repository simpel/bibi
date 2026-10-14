import { getDb } from "@okazi/db";
import { createId } from "@paralleldrive/cuid2";
import type { ExecuteContext, PermissionAction, PermissionSet } from "../src/index";
import { testContext } from "./helpers";

export type TestOrgInput = { access?: PermissionAction; permissions?: PermissionSet };

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
export async function addTestMember({
  context,
  role,
  name = "Test Person",
}: AddTestMemberInput): Promise<string> {
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
  return memberId;
}
