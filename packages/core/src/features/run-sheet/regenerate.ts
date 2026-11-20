import { z } from "zod";
import { createSystemContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { FollowUpInput, OperationContext } from "../../operations/types";
import type { PermissionSet } from "../../permissions/permission-set";
import { generateRunSheet } from "./operations";

type Scope = { context: OperationContext; orderId: string };

/** What the system needs to generate a run sheet: it copies these features (`checkSourcesReadable`). */
const GENERATE_PERMISSIONS: PermissionSet = {
  runSheet: ["write"],
  order: ["read"],
  program: ["read"],
  item: ["read"],
  comment: ["read"],
};

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
  const system = createSystemContext({
    organizationId: context.organizationId,
    permissions: GENERATE_PERMISSIONS,
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

const DefinitionOutputSchema = z.object({ id: z.string(), status: z.string().optional() });

/**
 * `followUp` of creating or changing a run sheet type: makes its versions for the open orders it
 * applies to now, since nothing else would until the next change of those orders (ADR 0092). An
 * order applies when a line in a state that goes on run sheets has an item of one of its types,
 * or when it already has a version of it (the new contents then give the next one).
 */
export async function regenerateForDefinition({
  output,
  context,
}: FollowUpInput<unknown, unknown>) {
  const definition = DefinitionOutputSchema.safeParse(output);
  if (!definition.success || definition.data.status === "ARCHIVED") return;
  const runSheetDefinitionId = definition.data.id;
  const types = await context.db.runSheetDefinitionEntityType.findMany({
    where: { runSheetDefinitionId },
    select: { entityTypeId: true },
  });
  const orders = await context.db.order.findMany({
    where: {
      orderStatus: { closes: false },
      OR: [
        { runSheets: { some: { runSheetDefinitionId } } },
        {
          lines: {
            some: {
              status: "ACTIVE",
              state: { inRunSheets: true },
              item: {
                status: "ACTIVE",
                entityTypeId: { in: types.map((type) => type.entityTypeId) },
              },
            },
          },
        },
      ],
    },
    select: { id: true },
  });
  const system = createSystemContext({
    organizationId: context.organizationId,
    permissions: GENERATE_PERMISSIONS,
    ...(context.now ? { now: context.now } : {}),
  });
  for (const { id: orderId } of orders) {
    await execute({
      operation: generateRunSheet,
      input: { orderId, runSheetDefinitionId },
      context: system,
    });
  }
}
