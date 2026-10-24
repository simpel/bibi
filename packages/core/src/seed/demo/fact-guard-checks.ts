import { changeTicketStatus } from "../../features/ticket/change-status-operation";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckDemoFactGuardsInput = { context: ExecuteContext; org: DemoOrg };

/** An open ticket without an accepted quote that the organization lets move into the status. */
async function ticketWithoutQuote({
  context,
  statusId,
}: {
  context: ExecuteContext;
  statusId: string;
}) {
  return context.db.ticket.findFirst({
    where: {
      ticketStatus: { closes: false, transitionsFrom: { some: { toStatusId: statusId } } },
      quotes: { none: { quoteStatus: "ACCEPTED" } },
    },
    orderBy: { reference: "asc" },
  });
}

/**
 * ADR 0054: a status guards a fact, it does not store it. For every status that requires an
 * accepted quote, moving a ticket without one there is refused with that blocker (and so changes
 * nothing). Returns failure messages.
 */
export async function checkDemoFactGuards({
  context,
  org,
}: CheckDemoFactGuardsInput): Promise<string[]> {
  const failures: string[] = [];
  const guarded = await context.db.ticketStatus.findMany({
    where: { requiresAcceptedQuote: true },
  });
  for (const ticketStatus of guarded) {
    const ticket = await ticketWithoutQuote({ context, statusId: ticketStatus.id });
    if (!ticket) continue;
    const input = { ticketId: ticket.id, statusId: ticketStatus.id, reason: "Seed check" };
    const result = await execute({ operation: changeTicketStatus, input, context });
    const refused = !result.ok && result.error.issues.some((issue) => issue.path === "quote");
    if (!refused) {
      failures.push(
        `${org.slug}: #${ticket.reference} entered "${ticketStatus.name}" without a quote`,
      );
    }
  }
  return failures;
}
