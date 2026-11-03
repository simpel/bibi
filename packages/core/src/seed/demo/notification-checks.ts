import type { ExecuteContext } from "../../operations/context";
import type { DemoOrg } from "./types";

export type CheckDemoNotificationsInput = { context: ExecuteContext; org: DemoOrg };

/**
 * ADR 0094: every seeded ticket's main assignee was told (ASSIGNED, made by the ticket and
 * assignment commands' `followUp`), and every notification is for a member. Returns failure
 * messages.
 */
export async function checkDemoNotifications({
  context,
  org,
}: CheckDemoNotificationsInput): Promise<string[]> {
  const [assigned, told, members] = await Promise.all([
    context.db.assignment.findMany({
      where: { record: { base: "TICKET" }, responsibilityId: null, assigneeId: { not: null } },
      select: { recordId: true, assigneeId: true },
    }),
    context.db.notification.findMany({
      where: { kind: "ASSIGNED" },
      select: { ticketId: true, recipientUserId: true },
    }),
    context.db.member.findMany({ select: { userId: true } }),
  ]);
  const toldKeys = new Set(told.map((row) => `${row.ticketId}:${row.recipientUserId}`));
  const missing = assigned.filter((row) => !toldKeys.has(`${row.recordId}:${row.assigneeId}`));
  const memberIds = new Set(members.map((member) => member.userId));
  const strangers = await context.db.notification.count({
    where: { recipientUserId: { notIn: [...memberIds] } },
  });
  const failures: string[] = [];
  if (missing.length > 0) {
    failures.push(
      `${org.slug}: ${missing.length} assigned tickets without an ASSIGNED notification`,
    );
  }
  if (strangers > 0) failures.push(`${org.slug}: ${strangers} notifications for non-members`);
  return failures;
}
