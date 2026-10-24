import { hasPermission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import type { TicketStatusWarning } from "./status-history-schema";

export type StatusWarningsInput = {
  context: Pick<OperationContext, "db" | "permissions">;
  ticketId: string;
  statusId: string;
};

/**
 * The status the fact "quote accepted" leads to: the first active status entered by the
 * `QUOTE_ACCEPTED` event or requiring an accepted quote. Null when the organization has none.
 */
async function acceptancePosition({ context }: Pick<StatusWarningsInput, "context">) {
  const ticketStatus = await context.db.ticketStatus.findFirst({
    where: { OR: [{ event: "QUOTE_ACCEPTED" }, { requiresAcceptedQuote: true }] },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    select: { position: true },
  });
  return ticketStatus?.position ?? null;
}

/**
 * Where the ticket's status contradicts a fact owned elsewhere (ADR 0054, rule 4): an accepted
 * quote while the ticket is in an open status before the acceptance status. Derived, never
 * resolved by changing either side. Quote facts are only shown to callers who may read quotes.
 */
export async function statusWarnings({
  context,
  ticketId,
  statusId,
}: StatusWarningsInput): Promise<TicketStatusWarning[]> {
  if (!hasPermission({ permissions: context.permissions, permission: "quote:read" })) return [];
  const accepted = await context.db.quote.count({ where: { ticketId, quoteStatus: "ACCEPTED" } });
  if (accepted === 0) return [];
  const [position, ticketStatus] = await Promise.all([
    acceptancePosition({ context }),
    context.db.ticketStatus.findFirst({
      where: { id: statusId, status: { in: ["ACTIVE", "ARCHIVED"] } },
      select: { position: true, closes: true },
    }),
  ]);
  if (position === null || !ticketStatus || ticketStatus.closes) return [];
  return ticketStatus.position < position ? ["QUOTE_ACCEPTED_IN_EARLIER_STATUS"] : [];
}
