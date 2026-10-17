import { getDb } from "@okazi/db";
import { createId } from "@paralleldrive/cuid2";
import { type ExecuteContext, execute, type GrantableRole, inviteMember } from "../src/index";
import { testOrg } from "./org-helpers";

/** An owner context whose inviter is a real user (`invitation.inviterId` has a FK). */
export const withInviter = async (): Promise<ExecuteContext> => {
  const base = await testOrg();
  const userId = `user_${createId()}`;
  await getDb().user.create({
    data: { id: userId, name: "Inviter", email: `${userId}@example.test`, emailVerified: true },
  });
  return { ...base, actor: { type: "user" as const, userId } };
};

export const invite = ({
  context,
  email,
  role,
}: {
  context: ExecuteContext;
  email: string;
  role: GrantableRole;
}) => execute({ operation: inviteMember, input: { email, role }, context });
