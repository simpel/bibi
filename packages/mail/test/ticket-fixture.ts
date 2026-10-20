import { randomUUID } from "node:crypto";
import {
  createCustomer,
  createEntityType,
  createExecuteContext,
  createTicket,
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

/** A fresh organization (provisioned like a signup) with one ticket tomorrow. */
export async function ticketFixture(): Promise<{ context: ExecuteContext; ticketId: string }> {
  const organizationId = `org_${randomUUID()}`;
  const context = createExecuteContext({
    organizationId,
    roles: ["admin"],
    permissions: grantAll({}),
    actor: { type: "user", userId: `user_${randomUUID()}` },
  });
  value({ result: await provisionOrganization({ organizationId }) });
  const [ticketType, customerType] = await Promise.all(
    (["TICKET", "CUSTOMER"] as const).map(async (base) =>
      value({
        result: await execute({
          operation: createEntityType,
          input: { base, name: `${base} type` },
          context,
        }),
      }),
    ),
  );
  if (!ticketType || !customerType) throw new Error("Types were not created");
  const customer = value({
    result: await execute({
      operation: createCustomer,
      input: { entityTypeId: customerType.id, name: "Hisingen Energi AB" },
      context,
    }),
  });
  const input = { entityTypeId: ticketType.id, customerId: customer.id };
  const ticket = value({ result: await execute({ operation: createTicket, input, context }) });
  return { context, ticketId: ticket.id };
}
