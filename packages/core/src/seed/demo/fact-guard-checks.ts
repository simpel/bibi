import { changeTicketStatus } from "../../features/ticket/change-status-operation";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckDemoFactGuardsInput = { context: ExecuteContext; org: DemoOrg };

type Transition = { fromStatusId: string; toStatusId: string; toStatus: { name: string } };

/** An open ticket in the transition's start status without an accepted quote. */
const ticketWithoutQuote = ({
  context,
  transition,
}: {
  context: ExecuteContext;
  transition: Transition;
}) =>
  context.db.ticket.findFirst({
    where: {
      statusId: transition.fromStatusId,
      ticketStatus: { closes: false },
      quotes: { none: { quoteStatus: "ACCEPTED" } },
    },
    orderBy: { reference: "asc" },
  });

/**
 * ADR 0054, 0067: a gate guards a fact, it does not store it. For every transition with an
 * ACCEPTED_QUOTE gate, moving a ticket without an accepted quote along it is refused with that
 * gate named as the blocker (and so changes nothing). Returns failure messages.
 */
export async function checkDemoFactGuards({
  context,
  org,
}: CheckDemoFactGuardsInput): Promise<string[]> {
  const failures: string[] = [];
  const guarded = await context.db.ticketStatusTransition.findMany({
    where: { gates: { some: { key: "ACCEPTED_QUOTE" } } },
    include: { toStatus: { select: { name: true } } },
  });
  for (const transition of guarded) {
    const ticket = await ticketWithoutQuote({ context, transition });
    if (!ticket) continue;
    const input = { ticketId: ticket.id, statusId: transition.toStatusId, reason: "Seed check" };
    const result = await execute({ operation: changeTicketStatus, input, context });
    const refused = !result.ok && result.error.issues.some((issue) => issue.path === "quote");
    if (!refused) {
      const name = transition.toStatus.name;
      failures.push(`${org.slug}: #${ticket.reference} entered "${name}" without a quote`);
    }
  }
  return failures;
}
