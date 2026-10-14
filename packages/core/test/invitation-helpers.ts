import { getDb } from "@okazi/db";
import { createId } from "@paralleldrive/cuid2";
import { createRole, type ExecuteContext, execute, inviteMember } from "../src/index";
import { unwrap } from "./helpers";
import { testOrg } from "./org-helpers";

/** An org with roles, and an inviter that is a real user (`invitation.inviterId` has a FK). */
export const withInviter = async (): Promise<ExecuteContext> => {
  const base = await testOrg();
  const userId = `user_${createId()}`;
  await getDb().user.create({
    data: { id: userId, name: "Inviter", email: `${userId}@example.test`, emailVerified: true },
  });
  const context = { ...base, actor: { type: "user" as const, userId } };
  for (const [name, permissions] of [
    ["Kitchen", { venue: ["read"] }],
    ["Admin", { member: ["admin"], venue: ["admin"] }],
  ] as const) {
    unwrap({
      result: await execute({ operation: createRole, input: { name, permissions }, context }),
    });
  }
  return context;
};

export const invite = ({
  context,
  email,
  roles,
}: {
  context: ExecuteContext;
  email: string;
  roles: string[];
}) => execute({ operation: inviteMember, input: { email, roles }, context });
