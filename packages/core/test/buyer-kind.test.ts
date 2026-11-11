import { describe, expect, it } from "vitest";
import { execute, getOrder, updateCustomer, updateOrder } from "../src/index";
import { unwrap } from "./helpers";
import { createTestOrder, orderSetup } from "./order-helpers";

describe("business or private on customer and order (ADR 0106)", () => {
  it("defaults a customer to BUSINESS and keeps its kind when an update omits it", async () => {
    const { context, customer } = await orderSetup();
    expect(customer).toMatchObject({ buyerKind: "BUSINESS", organizationNumber: null });
    const input = { id: customer.id, buyerKind: "PRIVATE" as const };
    unwrap({ result: await execute({ operation: updateCustomer, input, context }) });
    const renamed = unwrap({
      result: await execute({
        operation: updateCustomer,
        input: { id: customer.id, name: "Rask" },
        context,
      }),
    });
    expect(renamed.buyerKind).toBe("PRIVATE");
  });

  it("stores the organisation number trimmed and clears it with null", async () => {
    const { context, customer } = await orderSetup();
    const set = unwrap({
      result: await execute({
        operation: updateCustomer,
        input: { id: customer.id, organizationNumber: " 556677-8899 " },
        context,
      }),
    });
    expect(set.organizationNumber).toBe("556677-8899");
    const cleared = unwrap({
      result: await execute({
        operation: updateCustomer,
        input: { id: customer.id, organizationNumber: null },
        context,
      }),
    });
    expect(cleared.organizationNumber).toBeNull();
  });

  it("lets an order follow its customer until it sets its own kind", async () => {
    const { context, type, customer } = await orderSetup();
    const order = await createTestOrder({
      context,
      entityTypeId: type.id,
      customerId: customer.id,
    });
    expect(order).toMatchObject({ buyerKind: null, effectiveBuyerKind: "BUSINESS" });

    const customerInput = { id: customer.id, buyerKind: "PRIVATE" as const };
    unwrap({ result: await execute({ operation: updateCustomer, input: customerInput, context }) });
    const followed = unwrap({
      result: await execute({ operation: getOrder, input: { id: order.id }, context }),
    });
    expect(followed.effectiveBuyerKind).toBe("PRIVATE");

    const own = unwrap({
      result: await execute({
        operation: updateOrder,
        input: { id: order.id, buyerKind: "BUSINESS" },
        context,
      }),
    });
    expect(own).toMatchObject({ buyerKind: "BUSINESS", effectiveBuyerKind: "BUSINESS" });

    const back = unwrap({
      result: await execute({
        operation: updateOrder,
        input: { id: order.id, buyerKind: null },
        context,
      }),
    });
    expect(back).toMatchObject({ buyerKind: null, effectiveBuyerKind: "PRIVATE" });
  });
});
