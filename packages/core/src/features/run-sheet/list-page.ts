import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import { canView } from "../../shared/can-view";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { parseQuery } from "../../shared/query/parse-query";
import { runSheetListOrder } from "./list-order";
import { runSheetQualifierWheres } from "./list-qualifiers";
import { RUN_SHEET_QUALIFIERS, type RunSheetListInput } from "./list-schema";
import { RUN_SHEET_INCLUDE, toRunSheetDto } from "./to-run-sheet-dto";

type Where = Prisma.RunSheetWhereInput;

const REFERENCE = /^#?(\d{1,9})$/;

type OwnWhereInput = { input: RunSheetListInput; text: string; orders: boolean };

/**
 * The given ids, the order's window and free text on the order's reference or title; the
 * order's columns only for callers who may view orders.
 */
function ownWhere({ input, text, orders }: OwnWhereInput): Where {
  const { orderId, runSheetDefinitionId, from, to } = input;
  const reference = REFERENCE.exec(text)?.[1];
  const order: Prisma.OrderWhereInput = {
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
  const filtersOrder = Object.keys(order).length > 0;
  if (filtersOrder && !orders) return { id: { in: [] } };
  return {
    ...(orderId ? { orderId } : {}),
    ...(runSheetDefinitionId ? { runSheetDefinitionId } : {}),
    ...(filtersOrder ? { order } : {}),
  };
}

function pagingArgs({ input }: { input: RunSheetListInput }) {
  const { limit, cursor, page } = input;
  return page ? { take: limit + 1, skip: (page - 1) * limit } : pageArgs({ limit, cursor });
}

export type LoadRunSheetPageInput = { input: RunSheetListInput; context: OperationContext };

/** One page of `runSheet.list`; with `page` it also counts the matches (`total`). */
export async function loadRunSheetPage({ input, context }: LoadRunSheetPageInput) {
  const query = parseQuery({ q: input.q, qualifiers: RUN_SHEET_QUALIFIERS });
  const orders = canView({ context, feature: "order" });
  const own = ownWhere({ input, text: query.text, orders });
  const qualifiers = await runSheetQualifierWheres({ filters: query.filters, context });
  const where = { AND: [own, ...qualifiers] };
  const [rows, total] = await Promise.all([
    context.db.runSheet.findMany({
      where,
      orderBy: runSheetListOrder({ input, context }),
      ...pagingArgs({ input }),
      include: RUN_SHEET_INCLUDE,
    }),
    input.page ? context.db.runSheet.count({ where }) : Promise.resolve(null),
  ]);
  const page = paginate({ rows, limit: input.limit });
  return {
    items: page.items.map((row) => toRunSheetDto({ row })),
    nextCursor: page.nextCursor,
    total,
  };
}
