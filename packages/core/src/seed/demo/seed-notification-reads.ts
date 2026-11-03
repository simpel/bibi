import type { Db } from "@bibi/db";
import { ok, type Result } from "../../errors/result";
import { markNotificationsRead } from "../../features/notification/write-operations";
import { createExecuteContext, type ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { grantAll } from "../../permissions/permission-set";
import { missing } from "./seed-fields";
import type { DemoOrg } from "./types";
import type { DemoUserIds } from "./users";

export type SeedNotificationReadsInput = {
  db: Db;
  context: ExecuteContext;
  org: DemoOrg;
  userIds: DemoUserIds;
};

/**
 * ADR 0094: after every command has told its people, each member in `notificationReads` marks
 * their oldest notifications read as themselves, through `notification.markRead`. The newest
 * stay unread, so the bell has a red dot.
 */
export async function seedNotificationReads({
  db,
  context,
  org,
  userIds,
}: SeedNotificationReadsInput): Promise<Result<true>> {
  for (const { user, read } of org.notificationReads ?? []) {
    const userId = userIds.get(user);
    if (!userId) return missing({ what: `user ${user}` });
    const oldest = await context.db.notification.findMany({
      where: { recipientUserId: userId },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      take: read,
      select: { id: true },
    });
    const self = createExecuteContext({
      organizationId: context.organizationId,
      roles: [],
      permissions: grantAll({}),
      actor: { type: "user", userId },
      db,
    });
    const ids = oldest.map(({ id }) => id);
    const marked = await execute({
      operation: markNotificationsRead,
      input: { ids },
      context: self,
    });
    if (!marked.ok) return marked;
  }
  return ok({ value: true });
}
