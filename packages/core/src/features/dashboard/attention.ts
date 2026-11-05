import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { visibleTo } from "../../shared/visible-to";
import { daysOverdue } from "../finance/aging";
import { loadOpenInvoices } from "../finance/load-facts";
import type { Attention, ExpiringHold } from "./attention-schema";
import type { DashboardHorizon } from "./horizon";
import { unsentRunSheets } from "./unsent-run-sheets";

type Context = Pick<OperationContext, "db" | "permissions">;
type Input = { context: Context; horizon: DashboardHorizon };

/** The line filter `order.expireHolds` acts on: active lines in an expiring state. */
const EXPIRING_LINE = { status: "ACTIVE", state: { status: "ACTIVE", expires: true } } as const;

/** Open orders whose expiring holds fall before `warnEnd`, soonest first (ADR 0044). */
async function expiringHolds({ context, horizon }: Input): Promise<ExpiringHold[]> {
  const orders = await context.db.order.findMany({
    where: {
      status: "ACTIVE",
      orderStatus: { closes: false },
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
  return orders.flatMap((order) =>
    order.holdsUntil
      ? [
          {
            orderId: order.id,
            reference: order.reference,
            title: order.title,
            customerName: visibleTo({ context, feature: "customer", value: order.customer.name }),
            holdsUntil: order.holdsUntil,
            lines: order.lines.length,
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
 * What needs attention (ADR 0080): expiring holds (`order:read`), unsent run sheets (`runSheet:read`)
 * and overdue invoices (`finance:read` and `payment:read`, the gate of Financials' own figure).
 */
export async function attention({ context, horizon }: Input): Promise<Attention> {
  const money =
    canView({ context, feature: "finance" }) && canView({ context, feature: "payment" });
  const [holds, runSheets, late] = await Promise.all([
    expiringHolds({ context, horizon }),
    canView({ context, feature: "runSheet" }) ? unsentRunSheets({ context, horizon }) : null,
    money ? overdue({ context, horizon }) : null,
  ]);
  return { expiringHolds: holds, unsentRunSheets: runSheets, overdue: late };
}
