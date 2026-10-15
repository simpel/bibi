import { randomUUID } from "node:crypto";
import {
  createBooking,
  createCustomer,
  createEntityType,
  createExecuteContext,
  type ExecuteContext,
  execute,
  grantAll,
  provisionOrganization,
  type Result,
} from "@okazi/core";

const value = <T>({ result }: { result: Result<T> }): T => {
  if (!result.ok) throw result.error;
  return result.value;
};

/** A fresh organization (provisioned like a signup) with one booking tomorrow. */
export async function bookingFixture(): Promise<{ context: ExecuteContext; bookingId: string }> {
  const organizationId = `org_${randomUUID()}`;
  const context = createExecuteContext({
    organizationId,
    roles: ["admin"],
    permissions: grantAll({ upTo: "admin" }),
    actor: { type: "user", userId: `user_${randomUUID()}` },
  });
  value({ result: await provisionOrganization({ organizationId }) });
  const [bookingType, customerType] = await Promise.all(
    (["BOOKING", "CUSTOMER"] as const).map(async (base) =>
      value({
        result: await execute({
          operation: createEntityType,
          input: { base, name: `${base} type` },
          context,
        }),
      }),
    ),
  );
  if (!bookingType || !customerType) throw new Error("Types were not created");
  const customer = value({
    result: await execute({
      operation: createCustomer,
      input: { entityTypeId: customerType.id, name: "Hisingen Energi AB" },
      context,
    }),
  });
  const startsAt = new Date(Date.now() + 86_400_000);
  const endsAt = new Date(startsAt.getTime() + 3_600_000);
  const input = { entityTypeId: bookingType.id, customerId: customer.id, startsAt, endsAt };
  const booking = value({ result: await execute({ operation: createBooking, input, context }) });
  return { context, bookingId: booking.id };
}
