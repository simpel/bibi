import type { OperationContext } from "../../operations/types";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { subjectIdFilter } from "../assignment/subject-filter";
import { ticketListOrder } from "./list-order";
import { qualifierWheres } from "./list-qualifiers";
import { parseTicketQuery } from "./list-query";
import type { TicketListInput } from "./list-schema";
import { ticketListWhere } from "./list-where";
import { TICKET_INCLUDE, toTicketDto } from "./to-ticket-dto";

export type LoadTicketPageInput = { input: TicketListInput; context: OperationContext };

/** Prisma paging: `skip` for a numbered `page`, else the cursor (one extra row = more pages). */
function pagingArgs({ input }: { input: TicketListInput }) {
  const { limit, cursor, page } = input;
  return page ? { take: limit + 1, skip: (page - 1) * limit } : pageArgs({ limit, cursor });
}

/**
 * One page of `ticket.list`. With `page` it also counts the matches (`total`); the count and the
 * rows run side by side on the same filter, which the organization indexes keep cheap.
 */
export async function loadTicketPage({ input, context }: LoadTicketPageInput) {
  const { assigneeId, followerId } = input;
  const ids = await subjectIdFilter({ context, subjectType: "TICKET", assigneeId, followerId });
  const query = parseTicketQuery({ q: input.q });
  const own = ticketListWhere({ input: { ...input, q: query.text || undefined }, context });
  const qualifiers = await qualifierWheres({ filters: query.filters, context });
  const where = { AND: [own, ids, ...qualifiers] };
  const [rows, total] = await Promise.all([
    context.db.ticket.findMany({
      where,
      orderBy: ticketListOrder({ input, context }),
      ...pagingArgs({ input }),
      include: TICKET_INCLUDE,
    }),
    input.page ? context.db.ticket.count({ where }) : Promise.resolve(null),
  ]);
  const page = paginate({ rows, limit: input.limit });
  return {
    items: page.items.map((row) => toTicketDto({ row })),
    nextCursor: page.nextCursor,
    total,
  };
}
