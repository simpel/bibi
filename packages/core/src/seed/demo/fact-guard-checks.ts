import { changeTicketStatus } from "../../features/ticket/change-status-operation";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckDemoFactGuardsInput = { context: ExecuteContext; org: DemoOrg };

type Move = { fromStatusId: string; toStatusId: string; toName: string };

/** An open ticket in the move's start status without an accepted quote. */
const ticketWithoutQuote = ({ context, move }: { context: ExecuteContext; move: Move }) =>
  context.db.ticket.findFirst({
    where: {
      statusId: move.fromStatusId,
      ticketStatus: { closes: false },
      quotes: { none: { quoteStatus: "ACCEPTED" } },
    },
    orderBy: { reference: "asc" },
  });

/** Every open status that can move into a status guarded by an ACCEPTED_QUOTE gate (ADR 0076). */
async function guardedMoves({ context }: { context: ExecuteContext }): Promise<Move[]> {
  const gates = await context.db.ticketStatusGate.findMany({
    where: { key: "ACCEPTED_QUOTE" },
    include: { toStatus: { select: { name: true } } },
  });
  const open = await context.db.ticketStatus.findMany({ where: { closes: false } });
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
 * ACCEPTED_QUOTE gate, moving a ticket without an accepted quote along it is refused with that
 * gate named as the blocker (and so changes nothing). Returns failure messages.
 */
export async function checkDemoFactGuards({
  context,
  org,
}: CheckDemoFactGuardsInput): Promise<string[]> {
  const failures: string[] = [];
  for (const move of await guardedMoves({ context })) {
    const ticket = await ticketWithoutQuote({ context, move });
    if (!ticket) continue;
    const input = { ticketId: ticket.id, statusId: move.toStatusId, reason: "Seed check" };
    const result = await execute({ operation: changeTicketStatus, input, context });
    const refused = !result.ok && result.error.issues.some((issue) => issue.path === "quote");
    if (!refused) {
      failures.push(`${org.slug}: #${ticket.reference} entered "${move.toName}" without a quote`);
    }
  }
  return failures;
}
