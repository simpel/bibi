import "server-only";
import { resolveExecuteContext } from "@okazi/auth";
import { hasPermission } from "@okazi/core";
import { headers } from "next/headers";

export type CallerAbilities = {
  skillAdmin: boolean;
  roleAdmin: boolean;
  memberAdmin: boolean;
  configurationWrite: boolean;
  itemWrite: boolean;
  customerWrite: boolean;
  contactWrite: boolean;
};

const NONE: CallerAbilities = {
  skillAdmin: false,
  roleAdmin: false,
  memberAdmin: false,
  configurationWrite: false,
  itemWrite: false,
  customerWrite: false,
  contactWrite: false,
};

/**
 * What the signed-in user's organization role allows, for hiding buttons that would only fail
 * (the operations still enforce everything). Uses the same resolver as `runOperation`.
 */
export async function getCallerAbilities(): Promise<CallerAbilities> {
  const context = await resolveExecuteContext({ headers: await headers() });
  if (!context.ok) return NONE;
  const { permissions } = context.value;
  return {
    skillAdmin: hasPermission({ permissions, permission: "skill:admin" }),
    roleAdmin: hasPermission({ permissions, permission: "role:admin" }),
    memberAdmin: hasPermission({ permissions, permission: "member:admin" }),
    configurationWrite: hasPermission({ permissions, permission: "configuration:write" }),
    itemWrite: hasPermission({ permissions, permission: "item:write" }),
    customerWrite: hasPermission({ permissions, permission: "customer:write" }),
    contactWrite: hasPermission({ permissions, permission: "contact:write" }),
  };
}
