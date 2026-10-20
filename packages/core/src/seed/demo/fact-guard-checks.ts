import { changeTicketPhase } from "../../features/ticket/change-phase-operation";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoOrg } from "./types";

export type CheckDemoFactGuardsInput = { context: ExecuteContext; org: DemoOrg };

/** An open ticket without an accepted quote that the organization lets move into the phase. */
async function ticketWithoutQuote({
  context,
  phaseId,
}: {
  context: ExecuteContext;
  phaseId: string;
}) {
  return context.db.ticket.findFirst({
    where: {
      phase: { terminal: false, transitionsFrom: { some: { toPhaseId: phaseId } } },
      quotes: { none: { quoteStatus: "ACCEPTED" } },
    },
    orderBy: { reference: "asc" },
  });
}

/**
 * ADR 0054: a phase guards a fact, it does not store it. For every phase that requires an
 * accepted quote, moving a ticket without one there is refused with that blocker (and so changes
 * nothing). Returns failure messages.
 */
export async function checkDemoFactGuards({
  context,
  org,
}: CheckDemoFactGuardsInput): Promise<string[]> {
  const failures: string[] = [];
  const guarded = await context.db.ticketPhase.findMany({ where: { requiresAcceptedQuote: true } });
  for (const phase of guarded) {
    const ticket = await ticketWithoutQuote({ context, phaseId: phase.id });
    if (!ticket) continue;
    const input = { ticketId: ticket.id, phaseId: phase.id, reason: "Seed check" };
    const result = await execute({ operation: changeTicketPhase, input, context });
    const refused = !result.ok && result.error.issues.some((issue) => issue.path === "quote");
    if (!refused) {
      failures.push(`${org.slug}: #${ticket.reference} entered "${phase.name}" without a quote`);
    }
  }
  return failures;
}
