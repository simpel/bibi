import "server-only";
import { resolveExecuteContext } from "@okazi/auth";
import { hasPermission } from "@okazi/core";
import { headers } from "next/headers";

export type CallerAbilities = { skillAdmin: boolean };

/**
 * What the signed-in user's organization role allows, for hiding buttons that would only fail
 * (the operations still enforce everything). Uses the same resolver as `runOperation`.
 */
export async function getCallerAbilities(): Promise<CallerAbilities> {
  const context = await resolveExecuteContext({ headers: await headers() });
  if (!context.ok) return { skillAdmin: false };
  return { skillAdmin: hasPermission({ roles: context.value.roles, permission: "skill:admin" }) };
}
