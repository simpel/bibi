import { ok, type Result } from "../../errors/result";
import { hasPermission, type Permission } from "../../operations/permission";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";

type Db = { context: Pick<OperationContext, "db"> };

export type CheckReadableInput = {
  context: Pick<OperationContext, "permissions">;
  permission: Permission;
  /** The input field that holds the referenced id. */
  path: string;
};

/**
 * A referenced record may only be set by a caller who may read it (`VALIDATION` on the field).
 * Checked before the lookup, so a caller without read access cannot probe which ids exist.
 */
export function checkReadable({ context, permission, path }: CheckReadableInput): Result<true> {
  if (hasPermission({ permissions: context.permissions, permission })) return ok({ value: true });
  const message = `Missing permission ${permission}`;
  return invalid({ message, issues: [{ path, message }] });
}

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

export type CheckCustomerInput = Db & { customerId: string };

/** The customer must be an active customer of the organization. */
export async function checkCustomer({ context, customerId }: CheckCustomerInput) {
  const found = await context.db.customer.count({ where: { id: customerId } });
  if (found > 0) return ok({ value: true });
  const message = "Unknown customer";
  return invalid({ message, issues: [{ path: "customerId", message }] });
}

export type CheckContactInput = Db & { contactId?: string | null; customerId: string };

/** A given contact must be an active contact person at the ticket's customer. */
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
