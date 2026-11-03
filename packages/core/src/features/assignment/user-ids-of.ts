import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";

export type UserIdsOfInput = {
  value: string;
  context: Pick<OperationContext, "db" | "permissions" | "actor">;
};

/**
 * Users a search value names: `me` is the caller; any other value is the member with exactly that
 * name or email, else every member whose name contains it. Only for callers who may view members
 * (ADR 0071), else nobody.
 */
export async function userIdsOf({ value, context }: UserIdsOfInput): Promise<string[]> {
  if (value.toLowerCase() === "me") return context.actor.userId ? [context.actor.userId] : [];
  if (!canView({ context, feature: "member" })) return [];
  const find = ({ user }: { user: Prisma.UserWhereInput }) =>
    context.db.member.findMany({ where: { user }, select: { userId: true } });
  const exact = { equals: value, mode: "insensitive" as const };
  const named = await find({ user: { OR: [{ name: exact }, { email: exact }] } });
  const members =
    named.length > 0
      ? named
      : await find({ user: { name: { contains: value, mode: "insensitive" } } });
  return members.map((member) => member.userId);
}
