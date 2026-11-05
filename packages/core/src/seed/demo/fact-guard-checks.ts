import { changeOrderStatus } from "../../features/order/change-status-operation";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckDemoFactGuardsInput = { context: ExecuteContext; org: DemoOrg };

type Move = { fromStatusId: string; toStatusId: string; toName: string };

/** An open order in the move's start status without an accepted quote. */
const orderWithoutQuote = ({ context, move }: { context: ExecuteContext; move: Move }) =>
  context.db.order.findFirst({
    where: {
      statusId: move.fromStatusId,
      orderStatus: { closes: false },
      quotes: { none: { quoteStatus: "ACCEPTED" } },
    },
    orderBy: { reference: "asc" },
  });

/** Every open status that can move into a status guarded by an ACCEPTED_QUOTE gate (ADR 0076). */
async function guardedMoves({ context }: { context: ExecuteContext }): Promise<Move[]> {
  const gates = await context.db.orderStatusGate.findMany({
    where: { key: "ACCEPTED_QUOTE" },
    include: { toStatus: { select: { name: true } } },
  });
  const open = await context.db.orderStatus.findMany({ where: { closes: false } });
  return gates.flatMap((gate) =>
    open
      .filter(
        ({ id }) => id !== gate.toStatusId && (!gate.fromStatusId || id === gate.fromStatusId),
      )
      .map((from) => ({
        fromStatusId: from.id,
        toStatusId: gate.toStatusId,
        toName: gate.toStatus.name,
      })),
  );
}

/**
 * ADR 0054, 0067: a gate guards a fact, it does not store it. For every move into a status with an
 * ACCEPTED_QUOTE gate, moving an order without an accepted quote along it is refused with that
 * gate named as the blocker (and so changes nothing). Returns failure messages.
 */
export async function checkDemoFactGuards({
  context,
  org,
}: CheckDemoFactGuardsInput): Promise<string[]> {
  const failures: string[] = [];
  for (const move of await guardedMoves({ context })) {
    const order = await orderWithoutQuote({ context, move });
    if (!order) continue;
    const input = { orderId: order.id, statusId: move.toStatusId, reason: "Seed check" };
    const result = await execute({ operation: changeOrderStatus, input, context });
    const refused = !result.ok && result.error.issues.some((issue) => issue.path === "quote");
    if (!refused) {
      failures.push(`${org.slug}: #${order.reference} entered "${move.toName}" without a quote`);
    }
  }
  return failures;
}
