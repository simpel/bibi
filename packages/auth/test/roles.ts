import {
  createExecuteContext,
  createRole,
  execute,
  grantAll,
  type PermissionSet,
} from "@okazi/core";
import { getAuth } from "../src/index";

export type AddRoleInput = { organizationId: string; name: string; permissions: PermissionSet };

/** Creates an org role through core, as SYSTEM (like the demo seed does). */
export async function addRole({ organizationId, name, permissions }: AddRoleInput): Promise<void> {
  const context = createExecuteContext({
    organizationId,
    roles: [],
    permissions: grantAll({ upTo: "admin" }),
    actor: { type: "system", userId: null },
  });
  const result = await execute({ operation: createRole, input: { name, permissions }, context });
  if (!result.ok) throw result.error;
}

export type AddMemberInput = { organizationId: string; userId: string; role: string };

export async function addMember({ organizationId, userId, role }: AddMemberInput): Promise<void> {
  // Better Auth types `role` as its static roles; dynamic roles (organizationRole) are strings.
  const body = { userId, organizationId, role: role as "member" };
  await getAuth().api.addMember({ body });
}

export const READ_ONLY: PermissionSet = { venue: ["read"], room: ["read"] };
export const WRITER: PermissionSet = { venue: ["write"], room: ["write"] };
