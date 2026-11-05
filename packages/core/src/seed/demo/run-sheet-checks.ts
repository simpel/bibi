import { listRunSheets } from "../../features/run-sheet/operations";
import { createExecuteContext, type ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { PRESET_PERMISSIONS } from "../../permissions/presets";
import type { DemoOrg } from "./types";

export type CheckDemoRunSheetsInput = { context: ExecuteContext; org: DemoOrg };

/** `involves:me is:current` as a plain member, to prove the slot search finds their work. */
async function mineFor({ context, userId }: { context: ExecuteContext; userId: string }) {
  const asMember = createExecuteContext({
    organizationId: context.organizationId,
    roles: ["member"],
    permissions: PRESET_PERMISSIONS.member,
    actor: { type: "user", userId },
  });
  const input = { q: "involves:me is:current", page: 1, limit: 100 };
  const found = await execute({ operation: listRunSheets, input, context: asMember });
  return found.ok ? found.value.items.map((runSheet) => runSheet.id) : [];
}

/** The first current run sheet whose responsibility keeps its default assignee on the order. */
async function firstByDefault({ context }: { context: ExecuteContext }) {
  const chosen = await context.db.assignment.findMany({
    where: { responsibilityId: { not: null }, assigneeId: { not: null } },
    select: { recordId: true, responsibilityId: true },
  });
  const rows = await context.db.runSheet.findMany({
    where: { current: true },
    select: {
      ...{ id: true, orderId: true, responsibilityId: true },
      responsibility: { select: { name: true, defaultAssigneeId: true } },
    },
    orderBy: { createdAt: "asc" },
  });
  const overridden = ({ orderId, responsibilityId }: (typeof rows)[number]) =>
    chosen.some((row) => row.recordId === orderId && row.responsibilityId === responsibilityId);
  return rows.find((row) => !overridden(row));
}

/**
 * ADR 0092: an organization with run sheet definitions has generated run sheets, and the
 * default assignee of a current one's responsibility finds it with `involves:me`.
 */
export async function checkDemoRunSheets({ context, org }: CheckDemoRunSheetsInput) {
  if (org.runSheets.length === 0) return [];
  const first = await firstByDefault({ context });
  if (!first) return [`${org.slug}: no run sheets were generated`];
  const userId = first.responsibility.defaultAssigneeId;
  if (!userId) return [`${org.slug}: ${first.responsibility.name} has no default assignee`];
  const mine = await mineFor({ context, userId });
  return mine.includes(first.id)
    ? []
    : [`${org.slug}: ${first.responsibility.name}'s assignee does not find run sheet ${first.id}`];
}
