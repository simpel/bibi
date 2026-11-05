import { z } from "zod";
import { createExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { FollowUpInput, OperationContext } from "../../operations/types";
import { generateRunSheet } from "./operations";

type Scope = { context: OperationContext; orderId: string };

/**
 * Active definitions that apply to the order: one that already has a version for it, or one
 * that includes the item type of a line in a state that goes on run sheets (as the content does).
 */
async function applicableDefinitions({ context, orderId }: Scope): Promise<string[]> {
  const [versions, lines] = await Promise.all([
    context.db.runSheet.findMany({
      where: { orderId },
      distinct: ["runSheetDefinitionId"],
      select: { runSheetDefinitionId: true },
    }),
    context.db.line.findMany({
      where: {
        orderId,
        status: "ACTIVE",
        state: { inRunSheets: true },
        item: { status: "ACTIVE" },
      },
      select: { item: { select: { entityTypeId: true } } },
    }),
  ]);
  const included = await context.db.runSheetDefinitionEntityType.findMany({
    where: {
      entityTypeId: { in: [...new Set(lines.flatMap((line) => line.item?.entityTypeId ?? []))] },
    },
    select: { runSheetDefinitionId: true },
  });
  const ids = [...versions, ...included].map((row) => row.runSheetDefinitionId);
  const active = await context.db.runSheetDefinition.findMany({
    where: { id: { in: [...new Set(ids)] }, status: "ACTIVE" },
    select: { id: true },
  });
  return active.map((row) => row.id);
}

/**
 * Generates the next version of every run sheet that applies to a changed order (ADR 0092),
 * as the system: the change is the trigger, not the caller's right to generate. An unchanged
 * run sheet keeps its latest version; a concurrent change that took the version number is
 * retried once.
 */
export async function regenerateRunSheets({ context, orderId }: Scope): Promise<void> {
  const system = createExecuteContext({
    organizationId: context.organizationId,
    roles: [],
    permissions: { runSheet: ["write"], order: ["read"], program: ["read"], item: ["read"] },
    actor: { type: "system", userId: null },
    ...(context.now ? { now: context.now } : {}),
  });
  for (const runSheetDefinitionId of await applicableDefinitions({ context, orderId })) {
    const input = { orderId, runSheetDefinitionId };
    const first = await execute({ operation: generateRunSheet, input, context: system });
    if (!first.ok && first.error.code === "CONFLICT") {
      await execute({ operation: generateRunSheet, input, context: system });
    }
  }
}

const OrderOutputSchema = z.object({ id: z.string() });

/** `followUp` of a command whose output is the order. */
export async function regenerateForOrder({ output, context }: FollowUpInput<unknown, unknown>) {
  const order = OrderOutputSchema.safeParse(output);
  if (order.success) await regenerateRunSheets({ context, orderId: order.data.id });
}

const LineSideSchema = z.object({
  orderId: z.string().optional(),
  items: z.array(z.object({ orderId: z.string() })).optional(),
  lineId: z.string().nullish(),
});

/** `followUp` of a command whose output is a line, its sub-lines or a requirement. */
export async function regenerateForLine({
  input,
  output,
  context,
}: FollowUpInput<unknown, unknown>) {
  const out = LineSideSchema.safeParse(output);
  const known = out.success ? (out.data.orderId ?? out.data.items?.[0]?.orderId) : undefined;
  // Choosing no options leaves no sub-lines in the output: the chosen-for line names the order.
  const lineId = known ? null : LineSideSchema.safeParse(input).data?.lineId;
  const line = lineId
    ? await context.db.line.findFirst({ where: { id: lineId }, select: { orderId: true } })
    : null;
  const orderId = known ?? line?.orderId;
  if (orderId) await regenerateRunSheets({ context, orderId });
}
