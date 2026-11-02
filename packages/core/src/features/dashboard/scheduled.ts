import type { OperationContext } from "../../operations/types";
import { visibleTo } from "../../shared/visible-to";
import type { Scheduled } from "./attention-schema";
import { SCHEDULED_LIMIT } from "./schema";

type Context = Pick<OperationContext, "db" | "permissions">;

type Input = { context: Context; period: { start: Date; end: Date } };

/** Active lines of open tickets starting inside the range, soonest first. */
const loadStarting = ({ context, period }: Input) =>
  context.db.line.findMany({
    where: {
      status: "ACTIVE",
      startsAt: { gte: period.start, lt: period.end },
      ticket: { status: "ACTIVE", ticketStatus: { closes: false } },
    },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    select: {
      ticketId: true,
      startsAt: true,
      ticket: {
        select: {
          reference: true,
          title: true,
          customer: { select: { name: true } },
          ticketStatus: { select: { name: true } },
        },
      },
    },
  });

/** Open tickets with lines starting inside the range, by their first start (ADR 0080, 0086). */
export async function scheduled({ context, period }: Input): Promise<Scheduled[]> {
  const lines = await loadStarting({ context, period });
  const byTicket = new Map<string, Scheduled>();
  for (const { ticketId, startsAt, ticket } of lines) {
    const seen = byTicket.get(ticketId);
    if (seen) {
      seen.lines += 1;
      continue;
    }
    if (!startsAt || byTicket.size >= SCHEDULED_LIMIT) continue;
    byTicket.set(ticketId, {
      ticketId,
      reference: ticket.reference,
      title: ticket.title,
      customerName: visibleTo({ context, feature: "customer", value: ticket.customer.name }),
      statusName: ticket.ticketStatus.name,
      startsAt,
      lines: 1,
    });
  }
  return [...byTicket.values()];
}
