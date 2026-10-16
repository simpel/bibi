import { ok, type Result } from "../errors/result";
import type { OperationContext } from "../operations/types";
import { invalid } from "./errors";

export type CheckMembersInput = {
  context: Pick<OperationContext, "db">;
  /** Input field → user id. Omitted and null ids are not checked. */
  userIds: Record<string, string | null | undefined>;
};

/** Every given user id must be a member of the organization (owners, ADR 0022). */
export async function checkMembers({ context, userIds }: CheckMembersInput): Promise<Result<true>> {
  const issues = [];
  for (const [path, userId] of Object.entries(userIds)) {
    if (!userId) continue;
    const member = await context.db.member.count({ where: { userId } });
    if (member === 0) issues.push({ path, message: "Not a member of the organization" });
  }
  if (issues.length === 0) return ok({ value: true });
  return invalid({ message: "Owners must be members of the organization", issues });
}
