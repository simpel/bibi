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
const REPLY = "Parking is booked by the loading bay.";

type StaffInput = { context: ExecuteContext; userId: string };

/** A seeded staff member acting as themself, with the manager preset. */
function staffContext({ context, userId }: StaffInput) {
  return createExecuteContext({
    organizationId: context.organizationId,
    roles: ["manager"],
    permissions: PRESET_PERMISSIONS.manager,
    preset: "manager",
    scopes: ALL_RECORDS,
    actor: { type: "user", userId },
  });
}

/**
 * ADR 0115: a staff member comments on the first order with run sheet work, once on the whole
 * order and once on a line that goes on a run sheet, so the order page and the run sheets show
 * both; a second member replies to the order comment and mentions its author. Runs before the
 * run sheets are generated; skipped without staff or such a line.
 */
export async function seedDemoComments({
  context,
  userIds,
}: SeedDemoCommentsInput): Promise<Result<number>> {
  const [userId, colleagueId] = [...userIds.values()];
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
  const staff = staffContext({ context, userId });
  const first = await execute({
    operation: createComment,
    input: { orderId: line.orderId, body: ORDER_COMMENT },
    context: staff,
  });
  if (!first.ok) return first;
  const input = { orderId: line.orderId, lineId: line.id, body: LINE_COMMENT };
  const second = await execute({ operation: createComment, input, context: staff });
  if (!second.ok) return second;
  if (!colleagueId) return ok({ value: 2 });
  // A colleague answers the first comment and mentions its author (ADR 0115).
  const author = await context.db.member.findFirst({
    where: { userId },
    select: { user: { select: { name: true } } },
  });
  const reply = await execute({
    operation: createComment,
    input: {
      orderId: line.orderId,
      parentCommentId: first.value.id,
      body: `@${author?.user.name ?? ""} ${REPLY}`,
      mentionUserIds: [userId],
    },
    context: staffContext({ context, userId: colleagueId }),
  });
  return reply.ok ? ok({ value: 3 }) : reply;
}
