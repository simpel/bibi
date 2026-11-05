import { randomUUID } from "node:crypto";
import {
  createContact,
  createCustomer,
  createEntityType,
  createExecuteContext,
  createOrder,
  type ExecuteContext,
  execute,
  grantAll,
  provisionOrganization,
  type Result,
} from "@bibi/core";
import { FALLBACK_TIME_ZONE } from "@bibi/core/schemas";

const value = <T>({ result }: { result: Result<T> }): T => {
  if (!result.ok) throw result.error;
  return result.value;
};

/** A fresh organization (provisioned like a signup) with one order tomorrow. */
export async function orderFixture(): Promise<{ context: ExecuteContext; orderId: string }> {
  const organizationId = `org_${randomUUID()}`;
  const context = createExecuteContext({
    organizationId,
    roles: ["admin"],
    permissions: grantAll({}),
    actor: { type: "user", userId: `user_${randomUUID()}` },
  });
  value({ result: await provisionOrganization({ organizationId, timeZone: FALLBACK_TIME_ZONE }) });
  const [orderType, customerType] = await Promise.all(
    (["ORDER", "CUSTOMER"] as const).map(async (base) =>
      value({
        result: await execute({
          operation: createEntityType,
          input: { base, name: `${base} type` },
          context,
        }),
      }),
    ),
  );
  if (!orderType || !customerType) throw new Error("Types were not created");
  const customer = value({
    result: await execute({
      operation: createCustomer,
      input: { entityTypeId: customerType.id, name: "Hisingen Energi AB" },
      context,
    }),
  });
  const contactType = value({
    result: await execute({
      operation: createEntityType,
      input: { base: "CONTACT", name: "CONTACT type" },
      context,
    }),
  });
  const contact = value({
    result: await execute({
      operation: createContact,
      input: { entityTypeId: contactType.id, customerId: customer.id, name: "Anna Berg" },
      context,
    }),
  });
  const input = { entityTypeId: orderType.id, customerId: customer.id, contactId: contact.id };
  const order = value({ result: await execute({ operation: createOrder, input, context }) });
  return { context, orderId: order.id };
}
