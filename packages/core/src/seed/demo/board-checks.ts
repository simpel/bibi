import { pipelineBoard } from "../../features/pipeline/operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckDemoBoardInput = { context: ExecuteContext; org: DemoOrg };

type Card = { id: string; statusChangedAt: Date };

type TimeInStatusInput = CheckDemoBoardInput & { cards: readonly Card[] };

/** Every card's time in status is its order's newest status change (ADR 0054), not the audit log. */
async function timeInStatusFailures({ context, org, cards }: TimeInStatusInput) {
  const changes = await context.db.orderStatusChange.findMany({
    where: { orderId: { in: cards.map((card) => card.id) } },
    select: { orderId: true, changedAt: true },
    orderBy: { seq: "asc" },
  });
  const newest = new Map(changes.map((change) => [change.orderId, change.changedAt.getTime()]));
  const off = cards.filter((card) => newest.get(card.id) !== card.statusChangedAt.getTime());
  return off.length > 0 ? [`${org.slug}: ${off.length} cards with a wrong time in status`] : [];
}

/**
 * ADR 0041, 0043: `pipeline.board` (the default board, closed orders of the last year) has one column per seeded status, every seeded order is on
 * exactly one card (in its status's column), the Closed lane shows the closing orders, and the
 * time in status comes from the status history (ADR 0054).
 */
export async function checkDemoBoard({ context, org }: CheckDemoBoardInput): Promise<string[]> {
  const result = await execute({
    operation: pipelineBoard,
    input: { closedWithinDays: 365 },
    context,
  });
  if (!result.ok) return [`${org.slug}: pipeline.board failed: ${result.error.message}`];
  const { columns, cards } = result.value;
  const failures: string[] = [];
  const statuses = await context.db.orderStatus.findMany({ select: { id: true, name: true } });
  // The default board has one phase per status (ADR 0067), so one column per seeded status.
  if (columns.length !== statuses.length) {
    failures.push(`${org.slug}: ${columns.length} board columns, expected ${statuses.length}`);
  }
  if (cards.length !== org.orders.length) {
    failures.push(`${org.slug}: ${cards.length} board cards, expected ${org.orders.length}`);
  }
  const ids = new Set(cards.map((card) => card.id));
  if (ids.size !== cards.length) failures.push(`${org.slug}: an order is on two cards`);
  const known = new Set(columns.map((column) => column.id));
  if (cards.some((card) => !known.has(card.columnId))) {
    failures.push(`${org.slug}: a card is in no column`);
  }
  return [...failures, ...(await timeInStatusFailures({ context, org, cards }))];
}
