import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { checkBookable, checkPeriod } from "../occupancy/occupancy-rules";
import type { OptionCreateInput } from "./schema";

export type CheckOptionInput = { context: Pick<OperationContext, "db">; input: OptionCreateInput };

/** A future expiry date (`VALIDATION` on `expiresAt` otherwise). */
function checkExpiry({ expiresAt }: { expiresAt: Date }): Result<true> {
  if (expiresAt > new Date()) return ok({ value: true });
  const message = "The option must expire in the future";
  return invalid({ message, issues: [{ path: "expiresAt", message }] });
}

async function checkTicket({
  context,
  ticketId,
}: {
  context: Pick<OperationContext, "db">;
  ticketId?: string | null;
}): Promise<Result<true>> {
  if (!ticketId) return ok({ value: true });
  const ticket = await context.db.ticket.findFirst({ where: { id: ticketId } });
  if (ticket) return ok({ value: true });
  const message = "Unknown ticket";
  return invalid({ message, issues: [{ path: "ticketId", message }] });
}

/** A new option holds an active `BOOKABLE` item for a real period until a future date. */
export async function checkNewOption({ context, input }: CheckOptionInput): Promise<Result<true>> {
  const bookable = await checkBookable({ context, itemId: input.itemId });
  if (!bookable.ok) return bookable;
  const period = checkPeriod(input);
  if (!period.ok) return period;
  const expiry = checkExpiry(input);
  if (!expiry.ok) return expiry;
  return checkTicket({ context, ticketId: input.ticketId });
}
