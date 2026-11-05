import type { OperationContext } from "../../operations/types";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { subjectIdFilter } from "../assignment/subject-filter";
import { orderListOrder } from "./list-order";
import { qualifierWheres } from "./list-qualifiers";
import { parseOrderQuery } from "./list-query";
import type { OrderListInput } from "./list-schema";
import { orderListWhere } from "./list-where";
import { ORDER_INCLUDE, toOrderDto } from "./to-order-dto";

export type LoadOrderPageInput = { input: OrderListInput; context: OperationContext };

/** Prisma paging: `skip` for a numbered `page`, else the cursor (one extra row = more pages). */
function pagingArgs({ input }: { input: OrderListInput }) {
  const { limit, cursor, page } = input;
  return page ? { take: limit + 1, skip: (page - 1) * limit } : pageArgs({ limit, cursor });
}

/**
 * One page of `order.list`. With `page` it also counts the matches (`total`); the count and the
 * rows run side by side on the same filter, which the organization indexes keep cheap.
 */
export async function loadOrderPage({ input, context }: LoadOrderPageInput) {
  const { assigneeId, followerId } = input;
  const ids = await subjectIdFilter({ context, subjectType: "ORDER", assigneeId, followerId });
  const query = parseOrderQuery({ q: input.q });
  const own = orderListWhere({ input: { ...input, q: query.text || undefined }, context });
  const qualifiers = await qualifierWheres({ filters: query.filters, context });
  const where = { AND: [own, ids, ...qualifiers] };
  const [rows, total] = await Promise.all([
    context.db.order.findMany({
      where,
      orderBy: orderListOrder({ input, context }),
      ...pagingArgs({ input }),
      include: ORDER_INCLUDE,
    }),
    input.page ? context.db.order.count({ where }) : Promise.resolve(null),
  ]);
  const page = paginate({ rows, limit: input.limit });
  return {
    items: page.items.map((row) => toOrderDto({ row })),
    nextCursor: page.nextCursor,
    total,
  };
}
