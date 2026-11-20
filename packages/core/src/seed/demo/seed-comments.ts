import { ok, type Result } from "../../errors/result";
import { createComment } from "../../features/comment/write-operations";
import { createExecuteContext, type ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import { PRESET_PERMISSIONS } from "../../permissions/presets";
import { ALL_RECORDS } from "../../permissions/record-scope";
import type { DemoUserIds } from "./users";

export type SeedDemoCommentsInput = { context: ExecuteContext; userIds: DemoUserIds };

const ORDER_COMMENT = "The group arrives by bus; the driver needs parking for two hours.";
const LINE_COMMENT = "Serve the vegetarian plates first, the speaker leaves at 13:30.";

/**
 * ADR 0115: a staff member comments on the first order with run sheet work, once on the whole
 * order and once on a line that goes on a run sheet, so the order page and the run sheets show
 * both. Runs before the run sheets are generated; skipped without staff or such a line.
 */
export async function seedDemoComments({
  context,
  userIds,
}: SeedDemoCommentsInput): Promise<Result<number>> {
  const [userId] = [...userIds.values()];
  const types = await context.db.runSheetDefinitionEntityType.findMany({
    where: { runSheetDefinition: { status: "ACTIVE" } },
    select: { entityTypeId: true },
  });
  const line = await context.db.line.findFirst({
    where: {
      state: { inRunSheets: true },
      item: { entityTypeId: { in: types.map((row) => row.entityTypeId) } },
    },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    select: { id: true, orderId: true },
  });
  if (!userId || !line) return ok({ value: 0 });
  const staff = createExecuteContext({
    organizationId: context.organizationId,
    roles: ["manager"],
    permissions: PRESET_PERMISSIONS.manager,
    preset: "manager",
    scopes: ALL_RECORDS,
    actor: { type: "user", userId },
  });
  for (const input of [
    { orderId: line.orderId, body: ORDER_COMMENT },
    { orderId: line.orderId, lineId: line.id, body: LINE_COMMENT },
  ]) {
    const made = await execute({ operation: createComment, input, context: staff });
    if (!made.ok) return made;
  }
  return ok({ value: 2 });
}
