import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { parseQuery } from "../../shared/query/parse-query";
import { workOrderListOrder } from "./list-order";
import { workOrderQualifierWheres } from "./list-qualifiers";
import { WORK_ORDER_QUALIFIERS, type WorkOrderListInput } from "./list-schema";
import { toWorkOrderDto, WORK_ORDER_INCLUDE } from "./to-work-order-dto";

type Where = Prisma.WorkOrderWhereInput;

const REFERENCE = /^#?(\d{1,9})$/;

type OwnWhereInput = { input: WorkOrderListInput; text: string; tickets: boolean };

/**
 * The given ids, the ticket's window and free text on the ticket's reference or title; the
 * ticket's columns only for callers who may view tickets.
 */
function ownWhere({ input, text, tickets }: OwnWhereInput): Where {
  const { ticketId, workOrderDefinitionId, from, to } = input;
  const reference = REFERENCE.exec(text)?.[1];
  const ticket: Prisma.TicketWhereInput = {
    ...(from ? { desiredEndsAt: { gt: from } } : {}),
    ...(to ? { desiredStartsAt: { lt: to } } : {}),
    ...(text
      ? {
          OR: [
            ...(reference ? [{ reference: Number(reference) }] : []),
            { title: { contains: text, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };
  const filtersTicket = Object.keys(ticket).length > 0;
  if (filtersTicket && !tickets) return { id: { in: [] } };
  return {
    ...(ticketId ? { ticketId } : {}),
    ...(workOrderDefinitionId ? { workOrderDefinitionId } : {}),
    ...(filtersTicket ? { ticket } : {}),
  };
}

function pagingArgs({ input }: { input: WorkOrderListInput }) {
  const { limit, cursor, page } = input;
  return page ? { take: limit + 1, skip: (page - 1) * limit } : pageArgs({ limit, cursor });
}

export type LoadWorkOrderPageInput = { input: WorkOrderListInput; context: OperationContext };

/** One page of `workOrder.list`; with `page` it also counts the matches (`total`). */
export async function loadWorkOrderPage({ input, context }: LoadWorkOrderPageInput) {
  const query = parseQuery({ q: input.q, qualifiers: WORK_ORDER_QUALIFIERS });
  const tickets = canView({ context, feature: "ticket" });
  const own = ownWhere({ input, text: query.text, tickets });
  const qualifiers = await workOrderQualifierWheres({ filters: query.filters, context });
  const where = { AND: [own, ...qualifiers] };
  const [rows, total] = await Promise.all([
    context.db.workOrder.findMany({
      where,
      orderBy: workOrderListOrder({ input, context }),
      ...pagingArgs({ input }),
      include: WORK_ORDER_INCLUDE,
    }),
    input.page ? context.db.workOrder.count({ where }) : Promise.resolve(null),
  ]);
  const page = paginate({ rows, limit: input.limit });
  return {
    items: page.items.map((row) => toWorkOrderDto({ row })),
    nextCursor: page.nextCursor,
    total,
  };
}
