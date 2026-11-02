import type { OperationContext } from "../../operations/types";
import type { UnsentWorkOrder } from "./attention-schema";
import type { DashboardHorizon } from "./horizon";

type Context = Pick<OperationContext, "db">;

type Input = { context: Context; horizon: DashboardHorizon };

/** Every work order version of open tickets with a line starting inside the horizon, newest first. */
function loadWorkOrders({ context, horizon }: Input) {
  const inside = { status: "ACTIVE", startsAt: { gte: horizon.start, lt: horizon.end } } as const;
  return context.db.workOrder.findMany({
    where: {
      ticket: { status: "ACTIVE", ticketStatus: { closes: false }, lines: { some: inside } },
    },
    orderBy: { version: "desc" },
    select: {
      id: true,
      ticketId: true,
      workOrderDefinitionId: true,
      version: true,
      sentAt: true,
      workOrderDefinition: { select: { name: true } },
      ticket: {
        select: {
          reference: true,
          title: true,
          lines: {
            where: inside,
            orderBy: { startsAt: "asc" },
            take: 1,
            select: { startsAt: true },
          },
        },
      },
    },
  });
}

/**
 * The newest version of each ticket's work orders when it is not sent, for open tickets with a line
 * starting inside the horizon (ADR 0080), soonest event first.
 */
export async function unsentWorkOrders({ context, horizon }: Input): Promise<UnsentWorkOrder[]> {
  const workOrders = await loadWorkOrders({ context, horizon });
  const newest = new Map<string, (typeof workOrders)[number]>();
  for (const workOrder of workOrders) {
    const key = `${workOrder.ticketId}:${workOrder.workOrderDefinitionId}`;
    if (!newest.has(key)) newest.set(key, workOrder);
  }
  return [...newest.values()]
    .flatMap((workOrder) => {
      const startsAt = workOrder.ticket.lines[0]?.startsAt;
      if (workOrder.sentAt || !startsAt) return [];
      const { id: workOrderId, ticketId, version } = workOrder;
      const { reference, title } = workOrder.ticket;
      const { name } = workOrder.workOrderDefinition;
      return [{ workOrderId, ticketId, reference, title, name, version, startsAt }];
    })
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime());
}
