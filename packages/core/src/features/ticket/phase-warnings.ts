import { hasPermission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import type { TicketPhaseWarning } from "./phase-history-schema";

export type PhaseWarningsInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  ticketId: string;
  phaseId: string;
};

/**
 * The phase the fact "quote accepted" leads to: the first active phase entered by the
 * `QUOTE_ACCEPTED` event or requiring an accepted quote. Null when the organization has none.
 */
async function acceptancePosition({ context }: Pick<PhaseWarningsInput, "context">) {
  const phase = await context.db.ticketPhase.findFirst({
    where: { OR: [{ event: "QUOTE_ACCEPTED" }, { requiresAcceptedQuote: true }] },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    select: { position: true },
  });
  return phase?.position ?? null;
}

/**
 * Where the ticket's phase contradicts a fact owned elsewhere (ADR 0054, rule 4): an accepted
 * quote while the ticket is in an open phase before the acceptance phase. Derived, never
 * resolved by changing either side. Quote facts are only shown to callers who may read quotes.
 */
export async function phaseWarnings({
  context,
  ticketId,
  phaseId,
}: PhaseWarningsInput): Promise<TicketPhaseWarning[]> {
  if (!hasPermission({ permissions: context.permissions, permission: "quote:read" })) return [];
  const accepted = await context.db.quote.count({ where: { ticketId, quoteStatus: "ACCEPTED" } });
  if (accepted === 0) return [];
  const [position, phase] = await Promise.all([
    acceptancePosition({ context }),
    context.db.ticketPhase.findFirst({
      where: { id: phaseId, status: { in: ["ACTIVE", "ARCHIVED"] } },
      select: { position: true, terminal: true },
    }),
  ]);
  if (position === null || !phase || phase.terminal) return [];
  return phase.position < position ? ["QUOTE_ACCEPTED_IN_EARLIER_PHASE"] : [];
}
