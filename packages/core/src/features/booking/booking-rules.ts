import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid } from "../../shared/errors";
import { COORDINATED_PHASES } from "./phase-rules";

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

export type Owners = { salesOwnerId?: string | null; coordinatorId?: string | null };

/** Every given owner must be a member of the organization (ADR 0022). */
export async function checkOwners({ context, ...owners }: Db & Owners): Promise<Result<true>> {
  const issues = [];
  for (const path of ["salesOwnerId", "coordinatorId"] as const) {
    const userId = owners[path];
    if (!userId) continue;
    const member = await context.db.member.count({ where: { userId } });
    if (member === 0) issues.push({ path, message: "Not a member of the organization" });
  }
  if (issues.length === 0) return ok({ value: true });
  return invalid({ message: "Owners must be members of the organization", issues });
}

export type CheckCoordinatorKeptInput = Db & { bookingStatusId: string };

/** From the `CONFIRMED` phase a booking needs a coordinator, so it cannot be removed. */
export async function checkCoordinatorKept({
  context,
  bookingStatusId,
}: CheckCoordinatorKeptInput) {
  const status = await context.db.bookingStatus.findFirst({
    // An archived status can still be in use, so it is read too.
    where: { id: bookingStatusId, status: { in: ["ACTIVE", "ARCHIVED"] } },
    select: { phase: true, name: true },
  });
  if (!status || !COORDINATED_PHASES.includes(status.phase)) {
    return ok({ value: true });
  }
  return conflict({ message: `A booking in "${status.name}" requires a coordinator` });
}
