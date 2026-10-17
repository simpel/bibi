import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";

type Db = { context: Pick<OperationContext, "db"> };

export type CheckPeriodInput = { startsAt: Date; endsAt: Date };

/** The booking must end after it starts. */
export function checkPeriod({ startsAt, endsAt }: CheckPeriodInput): Result<true> {
  if (endsAt > startsAt) return ok({ value: true });
  const message = "The booking must end after it starts";
  return invalid({ message, issues: [{ path: "endsAt", message }] });
}

export type CheckCustomerInput = Db & { customerId: string };

/** The customer must be an active customer of the organization. */
export async function checkCustomer({ context, customerId }: CheckCustomerInput) {
  const found = await context.db.customer.count({ where: { id: customerId } });
  if (found > 0) return ok({ value: true });
  const message = "Unknown customer";
  return invalid({ message, issues: [{ path: "customerId", message }] });
}
