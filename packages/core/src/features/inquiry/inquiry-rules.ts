import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";

type Db = { context: Pick<OperationContext, "db"> };

export type CheckDesiredPeriodInput = {
  desiredStartsAt?: Date | null;
  desiredEndsAt?: Date | null;
};

/** When both desired dates are given, the end must come after the start. */
export function checkDesiredPeriod({
  desiredStartsAt,
  desiredEndsAt,
}: CheckDesiredPeriodInput): Result<true> {
  if (!desiredStartsAt || !desiredEndsAt || desiredEndsAt > desiredStartsAt) {
    return ok({ value: true });
  }
  const message = "The desired end must come after the desired start";
  return invalid({ message, issues: [{ path: "desiredEndsAt", message }] });
}

export type CheckContactInput = Db & { contactId?: string | null; customerId: string };

/** A given contact must be an active contact person at the inquiry's customer. */
export async function checkContact({
  context,
  contactId,
  customerId,
}: CheckContactInput): Promise<Result<true>> {
  if (!contactId) return ok({ value: true });
  const found = await context.db.contact.count({ where: { id: contactId, customerId } });
  if (found > 0) return ok({ value: true });
  const message = "Not a contact person at the customer";
  return invalid({ message, issues: [{ path: "contactId", message }] });
}
