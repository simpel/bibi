import type { OperationContext } from "../../operations/types";
import { visibleTo } from "../../shared/visible-to";
import type { ComingUp } from "./attention-schema";
import type { DashboardHorizon } from "./horizon";
import { COMING_UP_LIMIT } from "./schema";

type Context = Pick<OperationContext, "db" | "permissions">;

type Input = { context: Context; horizon: DashboardHorizon };

/** Active lines of open tickets starting inside the horizon, soonest first. */
const loadStarting = ({ context, horizon }: Input) =>
  context.db.line.findMany({
    where: {
      status: "ACTIVE",
      startsAt: { gte: horizon.start, lt: horizon.end },
      ticket: { status: "ACTIVE", ticketStatus: { closes: false } },
    },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    select: {
      ticketId: true,
      startsAt: true,
      ticket: {
        select: {
          reference: true,
          customer: { select: { name: true } },
          ticketStatus: { select: { name: true } },
        },
      },
    },
  });

/** Open tickets with lines starting inside the horizon, by their first start (ADR 0080). */
export async function comingUp({ context, horizon }: Input): Promise<ComingUp[]> {
  const lines = await loadStarting({ context, horizon });
  const byTicket = new Map<string, ComingUp>();
  for (const { ticketId, startsAt, ticket } of lines) {
    const seen = byTicket.get(ticketId);
    if (seen) {
      seen.lines += 1;
      continue;
    }
    if (!startsAt || byTicket.size >= COMING_UP_LIMIT) continue;
    byTicket.set(ticketId, {
      ticketId,
      reference: ticket.reference,
      customerName: visibleTo({ context, feature: "customer", value: ticket.customer.name }),
      statusName: ticket.ticketStatus.name,
      startsAt,
      lines: 1,
    });
  }
  return [...byTicket.values()];
}
