import { getDb } from "@bibi/db";
import {
  type ExecuteContext,
  execute,
  listNotifications,
  type NotificationListInput,
} from "../src/index";
import { testContext, unwrap } from "./helpers";
import { addTestMemberWithUser } from "./org-helpers";

type Context = { context: ExecuteContext };

/** A member with the `member` preset (ADR 0050), so they may read tickets. Returns the user id. */
export async function readingMember({ context, name }: Context & { name: string }) {
  return (await addTestMemberWithUser({ context, role: "member", name })).userId;
}

/** Gives existing members (e.g. ones made with a display-only role) the `member` preset. */
export async function makeReaders({ context, userIds }: Context & { userIds: string[] }) {
  await getDb().member.updateMany({
    where: { organizationId: context.organizationId, userId: { in: userIds } },
    data: { role: "member" },
  });
}

/** The member's own context, with the `member` preset. */
export const asMember = ({ context, userId }: Context & { userId: string }) =>
  testContext({
    organizationId: context.organizationId,
    access: "read",
    actor: { type: "user", userId },
  });

export type InboxOfInput = Context & { userId: string; input?: Partial<NotificationListInput> };

/** The member's notifications, as `notification.list` returns them. */
export async function notificationsOf({ context, userId, input = {} }: InboxOfInput) {
  return unwrap({
    result: await execute({
      operation: listNotifications,
      input: { limit: 50, ...input },
      context: asMember({ context, userId }),
    }),
  });
}
