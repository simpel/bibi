import type { OrderStatus } from "@bibi/db";
import { changeOrderStatus } from "../../features/order/change-status-operation";
import { acceptQuote } from "../../features/quote/lifecycle-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrder } from "./order-types";
import { createSentQuote } from "./seed-order-quote";
import type { DemoOrg } from "./types";

type Ctx = { context: ExecuteContext };

const SELECT = {
  name: true,
  orderId: true,
  stateOverridden: true,
  state: { select: { name: true } },
  item: { select: { entityType: { select: { name: true } } } },
} as const;

/** The order's seeded lines by name, with state and item type. */
const loadLines = ({ context, orderId, order }: Ctx & { orderId: string; order: DemoOrder }) =>
  context.db.line.findMany({
    where: { orderId, name: { in: (order.lines ?? []).map((line) => line.name) } },
    select: SELECT,
  });

type Lines = Awaited<ReturnType<typeof loadLines>>;
type ExpectInput = { org: DemoOrg; order: DemoOrder; before: Lines; after: Lines };

/** What each line should be in after the move: its override, the target cell, or unchanged. */
function moveFailures({ org, order, before, after }: ExpectInput): string[] {
  const move = order.checkMove;
  if (!move) return [];
  return (order.lines ?? []).flatMap((line) => {
    const was = before.find((row) => row.name === line.name);
    const now = after.find((row) => row.name === line.name);
    const type = was?.item?.entityType.name;
    const cell = org.pipeline.cells.find((row) => row.orderStatus === move.to && row.type === type);
    const expected =
      move.blocked || line.state ? was?.state?.name : (cell?.state ?? was?.state?.name);
    if (now?.state?.name === expected && now?.stateOverridden === Boolean(line.state)) return [];
    return [
      `${order.ref}: ${line.name} is ${now?.state?.name ?? "stateless"}, expected ${expected}`,
    ];
  });
}

type MoveToInput = Ctx & { order: DemoOrder; orderId: string; orderStatus: OrderStatus };

/**
 * The move to the status: by `order.changeStatus`, or for a status with a quote event by accepting
 * the order's sent quote (made first when it has none).
 */
async function moveTo({ context, order, orderId, orderStatus }: MoveToInput) {
  if (!orderStatus.event) {
    const input = { orderId, statusId: orderStatus.id };
    return execute({ operation: changeOrderStatus, input, context });
  }
  const sent = await context.db.quote.findFirst({ where: { orderId, quoteStatus: "SENT" } });
  const quote = sent
    ? { ok: true as const, value: sent.id }
    : await createSentQuote({ context, order, orderId });
  if (!quote.ok) return quote;
  return execute({ operation: acceptQuote, input: { id: quote.value }, context });
}

type CheckOrderInput = Ctx & { org: DemoOrg; order: DemoOrder };

async function checkOrder({ context, org, order }: CheckOrderInput): Promise<string[]> {
  const move = order.checkMove;
  const reference = org.orders.indexOf(order) + 1;
  const dbOrder = await context.db.order.findFirst({
    where: { organizationId: context.organizationId, reference },
    select: { id: true },
  });
  const orderId = dbOrder?.id;
  if (!move || !orderId) return [`${order.ref}: no lines to move`];
  const before = await loadLines({ context, orderId, order });
  const orderStatus = await context.db.orderStatus.findFirst({ where: { name: move.to } });
  if (!orderStatus) return [`${order.ref}: no status ${move.to}`];
  const result = await moveTo({ context, order, orderId, orderStatus });
  const lineBlockers = result.ok
    ? []
    : result.error.issues.filter((i) => i.path.startsWith("lines."));
  const failures: string[] = [];
  if (move.blocked && lineBlockers.length === 0)
    failures.push(`${order.ref}: the move was not blocked by a line`);
  if (!move.blocked && !result.ok) failures.push(`${order.ref}: ${result.error.message}`);
  const after = await loadLines({ context, orderId, order });
  return [...failures, ...moveFailures({ org, order, before, after })];
}

/**
 * The status grid checks of `docs/demo-seed.md` (ADR 0044): every order with a `checkMove` is
 * moved with `order.changeStatus`, or by accepting its quote for a status with a quote event. A blocked move must be refused by a line (a hard hold
 * collision) and change nothing; an allowed one must move the lines to the target status's cells,
 * keep lines whose cell is empty and skip overridden lines. Returns failure messages.
 */
export async function checkDemoGrid({ context, org }: Ctx & { org: DemoOrg }): Promise<string[]> {
  const failures: string[] = [];
  for (const order of org.orders.filter((row) => row.checkMove)) {
    failures.push(...(await checkOrder({ context, org, order })));
  }
  return failures.map((failure) => `${org.slug}: ${failure}`);
}
