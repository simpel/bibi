import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { CustomerListInput } from "./schema";
import { CUSTOMER_INCLUDE, type CustomerRow } from "./to-customer-dto";

type Ctx = { context: Pick<OperationContext, "db"> };

export type RecentCustomersInput = Ctx & {
  /** The list's customer filters (ids, type, name). */
  where: Prisma.CustomerWhereInput;
  input: Pick<CustomerListInput, "limit" | "cursor">;
};

/** The cursor customer's position: its latest order's creation. */
async function cursorAt({ context, cursor }: Ctx & { cursor: string }) {
  const latest = await context.db.order.aggregate({
    where: { customerId: cursor },
    _max: { createdAt: true },
  });
  return latest._max.createdAt;
}

/** Groups after the cursor in (latest desc, customer id desc) order. */
async function afterCursor({ context, cursor }: Ctx & { cursor: string | undefined }) {
  if (!cursor) return undefined;
  const at = await cursorAt({ context, cursor });
  if (!at) return undefined;
  return {
    OR: [
      { createdAt: { _max: { lt: at } } },
      { AND: [{ createdAt: { _max: { equals: at } } }, { customerId: { lt: cursor } }] },
    ],
  } satisfies Prisma.OrderScalarWhereWithAggregatesInput;
}

/**
 * Customers ordered by their latest active order's creation, newest first (ADR 0081: the
 * intake's "recent customers"). Customers without an active order are left out. One grouped
 * query over orders picks the page, one query loads those customers: no per-customer reads.
 */
export async function recentCustomers({
  context,
  where,
  input,
}: RecentCustomersInput): Promise<CustomerRow[]> {
  const having = await afterCursor({ context, cursor: input.cursor });
  const groups = await context.db.order.groupBy({
    by: ["customerId"],
    where: { customer: { ...where, status: "ACTIVE" } },
    _max: { createdAt: true },
    ...(having ? { having } : {}),
    orderBy: [{ _max: { createdAt: "desc" } }, { customerId: "desc" }],
    take: input.limit + 1,
  });
  const ids = groups.map((group) => group.customerId);
  const rows = await context.db.customer.findMany({
    where: { id: { in: ids } },
    include: CUSTOMER_INCLUDE,
  });
  const byId = new Map(rows.map((row) => [row.id, row]));
  return ids.flatMap((id) => byId.get(id) ?? []);
}
