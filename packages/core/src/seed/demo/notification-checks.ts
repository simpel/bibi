import type { ExecuteContext } from "../../operations/context";
import type { DemoOrg } from "./types";

export type CheckDemoNotificationsInput = { context: ExecuteContext; org: DemoOrg };

/** Each member in `notificationReads` has exactly that many read and at least one unread. */
async function checkReads({ context, org }: CheckDemoNotificationsInput) {
  const failures: string[] = [];
  for (const { user, read } of org.notificationReads ?? []) {
    const member = await context.db.member.findFirst({
      where: { user: { name: user } },
      select: { userId: true },
    });
    const where = { recipientUserId: member?.userId ?? "" };
    const [seen, unread] = await Promise.all([
      context.db.notification.count({ where: { ...where, readAt: { not: null } } }),
      context.db.notification.count({ where: { ...where, readAt: null } }),
    ]);
    if (seen !== read) failures.push(`${org.slug}: ${user} has ${seen} read, expected ${read}`);
    if (unread === 0) failures.push(`${org.slug}: ${user} has no unread notifications`);
  }
  return failures;
}

/**
 * ADR 0094: every seeded order's main assignee was told (ASSIGNED, made by the order and
 * assignment commands' `followUp`), every notification is for a member, and the members in
 * `notificationReads` read what the data says. Returns failure messages.
 */
export async function checkDemoNotifications({
  context,
  org,
}: CheckDemoNotificationsInput): Promise<string[]> {
  const [assigned, told, members] = await Promise.all([
    context.db.assignment.findMany({
      where: { record: { base: "ORDER" }, responsibilityId: null, assigneeId: { not: null } },
      select: { recordId: true, assigneeId: true },
    }),
    context.db.notification.findMany({
      where: { kind: "ASSIGNED" },
      select: { orderId: true, recipientUserId: true },
    }),
    context.db.member.findMany({ select: { userId: true } }),
  ]);
  const toldKeys = new Set(told.map((row) => `${row.orderId}:${row.recipientUserId}`));
  const missing = assigned.filter((row) => !toldKeys.has(`${row.recordId}:${row.assigneeId}`));
  const memberIds = new Set(members.map((member) => member.userId));
  const strangers = await context.db.notification.count({
    where: { recipientUserId: { notIn: [...memberIds] } },
  });
  const failures: string[] = [];
  if (missing.length > 0) {
    failures.push(
      `${org.slug}: ${missing.length} assigned orders without an ASSIGNED notification`,
    );
  }
  if (strangers > 0) failures.push(`${org.slug}: ${strangers} notifications for non-members`);
  return [...failures, ...(await checkReads({ context, org }))];
}
