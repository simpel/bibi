import { z } from "zod";
import { createExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { FollowUpInput, OperationContext } from "../../operations/types";
import { generateWorkOrder } from "./operations";

type Scope = { context: OperationContext; ticketId: string };

/**
 * Active definitions that apply to the ticket: one that already has a version for it, or one
 * that includes the item type of a line in a state that goes on work orders (as the content does).
 */
async function applicableDefinitions({ context, ticketId }: Scope): Promise<string[]> {
  const [versions, lines] = await Promise.all([
    context.db.workOrder.findMany({
      where: { ticketId },
      distinct: ["workOrderDefinitionId"],
      select: { workOrderDefinitionId: true },
    }),
    context.db.line.findMany({
      where: {
        ticketId,
        status: "ACTIVE",
        state: { inWorkOrders: true },
        item: { status: "ACTIVE" },
      },
      select: { item: { select: { entityTypeId: true } } },
    }),
  ]);
  const included = await context.db.workOrderDefinitionEntityType.findMany({
    where: {
      entityTypeId: { in: [...new Set(lines.flatMap((line) => line.item?.entityTypeId ?? []))] },
    },
    select: { workOrderDefinitionId: true },
  });
  const ids = [...versions, ...included].map((row) => row.workOrderDefinitionId);
  const active = await context.db.workOrderDefinition.findMany({
    where: { id: { in: [...new Set(ids)] }, status: "ACTIVE" },
    select: { id: true },
  });
  return active.map((row) => row.id);
}

/**
 * Generates the next version of every work order that applies to a changed ticket (ADR 0092),
 * as the system: the change is the trigger, not the caller's right to generate. An unchanged
 * work order keeps its latest version; a concurrent change that took the version number is
 * retried once.
 */
export async function regenerateWorkOrders({ context, ticketId }: Scope): Promise<void> {
  const system = createExecuteContext({
    organizationId: context.organizationId,
    roles: [],
    permissions: { workOrder: ["write"], ticket: ["read"], program: ["read"], item: ["read"] },
    actor: { type: "system", userId: null },
    ...(context.now ? { now: context.now } : {}),
  });
  for (const workOrderDefinitionId of await applicableDefinitions({ context, ticketId })) {
    const input = { ticketId, workOrderDefinitionId };
    const first = await execute({ operation: generateWorkOrder, input, context: system });
    if (!first.ok && first.error.code === "CONFLICT") {
      await execute({ operation: generateWorkOrder, input, context: system });
    }
  }
}

const TicketOutputSchema = z.object({ id: z.string() });

/** `followUp` of a command whose output is the ticket. */
export async function regenerateForTicket({ output, context }: FollowUpInput<unknown, unknown>) {
  const ticket = TicketOutputSchema.safeParse(output);
  if (ticket.success) await regenerateWorkOrders({ context, ticketId: ticket.data.id });
}

const LineSideSchema = z.object({
  ticketId: z.string().optional(),
  items: z.array(z.object({ ticketId: z.string() })).optional(),
  lineId: z.string().nullish(),
});

/** `followUp` of a command whose output is a line, its sub-lines or a requirement. */
export async function regenerateForLine({
  input,
  output,
  context,
}: FollowUpInput<unknown, unknown>) {
  const out = LineSideSchema.safeParse(output);
  const known = out.success ? (out.data.ticketId ?? out.data.items?.[0]?.ticketId) : undefined;
  // Choosing no options leaves no sub-lines in the output: the chosen-for line names the ticket.
  const lineId = known ? null : LineSideSchema.safeParse(input).data?.lineId;
  const line = lineId
    ? await context.db.line.findFirst({ where: { id: lineId }, select: { ticketId: true } })
    : null;
  const ticketId = known ?? line?.ticketId;
  if (ticketId) await regenerateWorkOrders({ context, ticketId });
}
