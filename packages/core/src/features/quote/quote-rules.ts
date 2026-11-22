import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { checkOrderOpen } from "../order/open-order";
import type { OrderDto } from "../order/schema";
import { loadOrder } from "../order/to-order-dto";
import type { QuoteDto } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

export type LoadOpenOrderInput = Db & { orderId: string };

/** The quote's order; an order in a closing status gets no new quotes or versions (`CONFLICT`). */
export async function loadOpenOrder({
  context,
  orderId,
}: LoadOpenOrderInput): Promise<Result<OrderDto>> {
  const order = await loadOrder({ context, id: orderId });
  if (!order) return notFound({ entity: "Order" });
  const open = await checkOrderOpen({ context, orderIds: [orderId] });
  return open.ok ? ok({ value: order }) : open;
}

/** Only a DRAFT can be edited; a sent quote is changed by making a new version. */
export function checkDraft({ quote }: { quote: QuoteDto }): Result<true> {
  if (quote.quoteStatus === "DRAFT") return ok({ value: true });
  return conflict({
    message: `A ${quote.quoteStatus} quote cannot be changed; make a new version with quote.revise`,
  });
}

/** The next version number of the order's quote (1 when it has none). */
export async function nextVersion({ context, orderId }: LoadOpenOrderInput): Promise<number> {
  const latest = await context.db.quote.findFirst({
    where: { orderId },
    orderBy: { version: "desc" },
    select: { version: true },
  });
  return (latest?.version ?? 0) + 1;
}
