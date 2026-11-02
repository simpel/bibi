import type { OperationContext } from "../../operations/types";

export type CallerSender = { fromName: string | null; fromEmail: string | null };

/**
 * Who handed in an `API` message (ADR 0085 decision 4): the API key's name, or the member's name
 * and email for a user (a partner's OAuth client acting as them). Never typed by the caller.
 */
export async function callerSender({
  context,
}: {
  context: OperationContext;
}): Promise<CallerSender> {
  const { apiKeyId, userId } = context.actor;
  if (apiKeyId) {
    const key = await context.db.apikey.findFirst({
      where: { id: apiKeyId },
      select: { name: true },
    });
    return { fromName: key?.name ?? null, fromEmail: null };
  }
  if (!userId) return { fromName: null, fromEmail: null };
  const member = await context.db.member.findFirst({
    where: { userId },
    select: { user: { select: { name: true, email: true } } },
  });
  return { fromName: member?.user.name ?? null, fromEmail: member?.user.email ?? null };
}
