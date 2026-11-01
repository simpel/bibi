import { ok, type Result } from "../../errors/result";
import { updateTicket } from "../../features/ticket/write-operations";
import type { ExecuteContext } from "../../operations/context";
import { execute } from "../../operations/execute";
import type { DemoTicket } from "./ticket-types";

export type SeedEstimatesInput = { context: ExecuteContext; ticket: DemoTicket; ticketId: string };

/**
 * The ticket's estimates in order (ADR 0074): the first at inquiry, then each re-estimate, each
 * through `ticket.update` so it lands in the estimate history.
 */
export async function seedTicketEstimates({
  context,
  ticket,
  ticketId,
}: SeedEstimatesInput): Promise<Result<true>> {
  for (const kr of ticket.estimatesKr ?? []) {
    const input = { id: ticketId, estimatedValueMinor: kr * 100 };
    const result = await execute({ operation: updateTicket, input, context });
    if (!result.ok) return result;
  }
  return ok({ value: true });
}
