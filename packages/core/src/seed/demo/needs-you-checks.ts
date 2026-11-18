import { listMembers } from "../../features/member/operations";
import { viewMyTasks } from "../../features/my-work/operations";
import type { MyWorkTaskKind } from "../../features/my-work/tasks-schema";
import { createExecuteContext, type ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { grantAll } from "../../permissions/permission-set";
import { ALL_RECORDS } from "../../permissions/record-scope";
import type { DemoOrg } from "./types";

export type CheckDemoNeedsYouInput = { context: ExecuteContext; org: DemoOrg };

/** At least this many kinds of task show across the members, so Needs you has something to show. */
const MIN_KINDS = 2;

/**
 * Spec: home, "Needs you": read as each member, the organization's tasks span several kinds, so
 * the start page has work to show from the first sign-in. An organization with no orders (a
 * blank one) is skipped.
 */
export async function checkDemoNeedsYou({
  context,
  org,
}: CheckDemoNeedsYouInput): Promise<string[]> {
  if (org.orders.length === 0) return [];
  const members = await execute({ operation: listMembers, input: { limit: 100 }, context });
  if (!members.ok) return [`${org.slug}: could not read members`];
  const kinds = new Set<MyWorkTaskKind>();
  for (const member of members.value.items) {
    const own = createExecuteContext({
      organizationId: context.organizationId,
      roles: [],
      permissions: grantAll({}),
      preset: "admin",
      scopes: ALL_RECORDS,
      actor: { type: "user", userId: member.userId },
    });
    const result = await execute({ operation: viewMyTasks, input: {}, context: own });
    if (!result.ok) return [`${org.slug}: myWork.tasks failed: ${result.error.message}`];
    for (const task of result.value.tasks ?? []) kinds.add(task.kind);
  }
  return kinds.size >= MIN_KINDS
    ? []
    : [`${org.slug}: Needs you shows ${kinds.size} kinds of task, want at least ${MIN_KINDS}`];
}
