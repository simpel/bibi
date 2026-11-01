import type { OperationContext } from "../../operations/types";
import { emailDomainOf } from "../../organization/email-domain";

export type CallerEmailDomainInput = { context: Pick<OperationContext, "db" | "actor"> };

/**
 * The domain of the calling member's own verified email (ADR 0076), or `null` for an API key, the
 * system, an unverified address or a public provider: a domain is only ever claimed by someone
 * who has proved they have an address there.
 */
export async function callerEmailDomain({
  context,
}: CallerEmailDomainInput): Promise<string | null> {
  const { userId } = context.actor;
  if (!userId) return null;
  const member = await context.db.member.findFirst({
    where: { userId },
    select: { user: { select: { email: true, emailVerified: true } } },
  });
  if (!member?.user.emailVerified) return null;
  return emailDomainOf({ email: member.user.email });
}
