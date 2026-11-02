import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { visibleTo } from "../../shared/visible-to";
import { daysOverdue } from "../finance/aging";
import { loadOpenInvoices } from "../finance/load-facts";
import type { Attention, ExpiringHold } from "./attention-schema";
import type { DashboardHorizon } from "./horizon";
import { unsentWorkOrders } from "./unsent-work-orders";

type Context = Pick<OperationContext, "db" | "permissions">;
type Input = { context: Context; horizon: DashboardHorizon };

/** The line filter `ticket.expireHolds` acts on: active lines in an expiring state. */
const EXPIRING_LINE = { status: "ACTIVE", state: { status: "ACTIVE", expires: true } } as const;

/** Open tickets whose expiring holds fall before `warnEnd`, soonest first (ADR 0044). */
async function expiringHolds({ context, horizon }: Input): Promise<ExpiringHold[]> {
  const tickets = await context.db.ticket.findMany({
    where: {
      status: "ACTIVE",
      ticketStatus: { closes: false },
      holdsUntil: { gte: horizon.start, lt: horizon.warnEnd },
      lines: { some: EXPIRING_LINE },
    },
    orderBy: { holdsUntil: "asc" },
    select: {
      id: true,
      reference: true,
      title: true,
      holdsUntil: true,
      customer: { select: { name: true } },
      lines: { where: EXPIRING_LINE, select: { id: true } },
    },
  });
  return tickets.flatMap((ticket) =>
    ticket.holdsUntil
      ? [
          {
            ticketId: ticket.id,
            reference: ticket.reference,
            title: ticket.title,
            customerName: visibleTo({ context, feature: "customer", value: ticket.customer.name }),
            holdsUntil: ticket.holdsUntil,
            lines: ticket.lines.length,
          },
        ]
      : [],
  );
}

/** Sent invoices with money open past their due date today, as one count and total. */
async function overdue({ context, horizon }: Input): Promise<Attention["overdue"]> {
  const open = await loadOpenInvoices({ context });
  const late = open.filter((row) => daysOverdue({ dueDate: row.dueDate, now: horizon.now }) > 0);
  return {
    invoices: late.length,
    totalMinor: late.reduce((sum, row) => sum + row.openMinor, 0),
  };
}

/**
 * What needs attention (ADR 0080): expiring holds (`ticket:read`), unsent work orders (`workOrder:read`)
 * and overdue invoices (`finance:read` and `payment:read`, the gate of Financials' own figure).
 */
export async function attention({ context, horizon }: Input): Promise<Attention> {
  const money =
    canView({ context, feature: "finance" }) && canView({ context, feature: "payment" });
  const [holds, workOrders, late] = await Promise.all([
    expiringHolds({ context, horizon }),
    canView({ context, feature: "workOrder" }) ? unsentWorkOrders({ context, horizon }) : null,
    money ? overdue({ context, horizon }) : null,
  ]);
  return { expiringHolds: holds, unsentWorkOrders: workOrders, overdue: late };
}
