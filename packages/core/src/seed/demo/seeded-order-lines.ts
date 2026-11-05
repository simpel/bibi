import type { ExecuteContext } from "../../operations/context";
import type { DemoLine } from "./order-types";
import type { DemoOrg } from "./types";

export type SeededOrderLinesInput = {
  context: ExecuteContext;
  org: DemoOrg;
  where: (input: { line: DemoLine }) => boolean;
};

export type SeededOrderLine = { line: DemoLine; orderId: string | undefined };

/**
 * The data's lines that match `where`, each with the id of the order it was seeded on (an
 * order's reference is its place in `org.orders`). A check finds a line within its own order:
 * the generated busy weeks reuse line names such as "Board meeting" on the same rooms.
 */
export async function seededOrderLines({
  context,
  org,
  where,
}: SeededOrderLinesInput): Promise<SeededOrderLine[]> {
  const rows = await context.db.order.findMany({
    where: { organizationId: context.organizationId },
    select: { id: true, reference: true },
  });
  const orderIdByRef = new Map(rows.map((row) => [row.reference, row.id]));
  return org.orders.flatMap((order, index) =>
    (order.lines ?? [])
      .filter((line) => where({ line }))
      .map((line) => ({ line, orderId: orderIdByRef.get(index + 1) })),
  );
}
