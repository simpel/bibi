import type { OperationContext } from "../../operations/types";
import { visibleTo } from "../../shared/visible-to";
import type { Scheduled } from "./attention-schema";
import { SCHEDULED_LIMIT } from "./schema";

type Context = Pick<OperationContext, "db" | "permissions">;

type Input = { context: Context; period: { start: Date; end: Date } };

/** Active lines of open orders starting inside the range, soonest first. */
const loadStarting = ({ context, period }: Input) =>
  context.db.line.findMany({
    where: {
      status: "ACTIVE",
      startsAt: { gte: period.start, lt: period.end },
      order: { status: "ACTIVE", orderStatus: { closes: false } },
    },
    orderBy: [{ startsAt: "asc" }, { id: "asc" }],
    select: {
      orderId: true,
      startsAt: true,
      order: {
        select: {
          reference: true,
          title: true,
          customer: { select: { name: true } },
          orderStatus: { select: { name: true } },
        },
      },
    },
  });

/** Open orders with lines starting inside the range, by their first start (ADR 0080, 0086). */
export async function scheduled({ context, period }: Input): Promise<Scheduled[]> {
  const lines = await loadStarting({ context, period });
  const byOrder = new Map<string, Scheduled>();
  for (const { orderId, startsAt, order } of lines) {
    const seen = byOrder.get(orderId);
    if (seen) {
      seen.lines += 1;
      continue;
    }
    if (!startsAt || byOrder.size >= SCHEDULED_LIMIT) continue;
    byOrder.set(orderId, {
      orderId,
      reference: order.reference,
      title: order.title,
      customerName: visibleTo({ context, feature: "customer", value: order.customer.name }),
      statusName: order.orderStatus.name,
      startsAt,
      lines: 1,
    });
  }
  return [...byOrder.values()];
}
