import { ok, type Result } from "../../errors/result";
import type { HandlerInput, OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";

export type CheckOrderOpenInput = {
  context: Pick<OperationContext, "db">;
  orderIds?: readonly string[];
  lineIds?: readonly string[];
};

/**
 * A closed order (its status `closes`) is a record: its content no longer changes. CONFLICT when
 * one of the orders, or the order of one of the lines, is closed. Money (invoices, deposits,
 * payments, refunds, credit notes), comments and follows stay open.
 */
export async function checkOrderOpen({
  context,
  orderIds = [],
  lineIds = [],
}: CheckOrderOpenInput): Promise<Result<true>> {
  if (orderIds.length === 0 && lineIds.length === 0) return ok({ value: true });
  const closed = await context.db.order.findFirst({
    where: {
      OR: [{ id: { in: [...orderIds] } }, { lines: { some: { id: { in: [...lineIds] } } } }],
      orderStatus: { closes: true },
    },
    select: { reference: true, orderStatus: { select: { name: true } } },
  });
  if (!closed) return ok({ value: true });
  return conflict({
    message:
      `Order #${closed.reference} is in "${closed.orderStatus.name}", which closes it: ` +
      "a closed order can no longer be changed",
  });
}

type Handler<I, T> = (args: HandlerInput<I>) => Promise<Result<T>>;

export type OpenOrderHandlerInput<I, T> = {
  handler: Handler<I, T>;
  /** The orders the handler's result belongs to. */
  orderIds: (value: T) => readonly string[];
};

/**
 * Wraps a command on an order's content so it is refused on a closed order. The check runs on
 * the result, so it covers every way the handler finds its order; the error rolls the change back.
 */
export function openOrderHandler<I, T>({
  handler,
  orderIds,
}: OpenOrderHandlerInput<I, T>): Handler<I, T> {
  return async (args) => {
    const result = await handler(args);
    if (!result.ok) return result;
    const open = await checkOrderOpen({ context: args.context, orderIds: orderIds(result.value) });
    return open.ok ? result : open;
  };
}
