import type { OperationContext } from "../../operations/types";

export type FindInvitationConflictInput = { context: Pick<OperationContext, "db">; email: string };

/** Why `email` cannot be invited (already a member or invited), or `null` when it can. */
export async function findInvitationConflict({
  context,
  email,
}: FindInvitationConflictInput): Promise<string | null> {
  const member = await context.db.member.findFirst({
    where: { user: { email: { equals: email, mode: "insensitive" } } },
    select: { id: true },
  });
  if (member) return "This person is already a member";
  const pending = await context.db.invitation.findFirst({
    where: { email, status: "pending", expiresAt: { gt: new Date() } },
    select: { id: true },
  });
  return pending ? "This person already has a pending invitation" : null;
}
