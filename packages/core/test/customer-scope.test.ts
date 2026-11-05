import { describe, expect, it } from "vitest";
import { applyOverrides, archiveCustomer, execute, getCustomer } from "../src/index";
import { archiveContactsOf } from "./contact-archive-helpers";
import { unwrap } from "./helpers";
import { createTestOrder, orderSetup } from "./order-helpers";

const withoutOrders = applyOverrides({
  preset: "admin",
  overrides: [{ feature: "order", action: "read", effect: "deny" }],
});

describe("customer feature scope (ADR 0050)", () => {
  it("fills orderCount only for a caller who may view orders", async () => {
    const { context, type, customer } = await orderSetup();
    await createTestOrder({ context, entityTypeId: type.id, customerId: customer.id });
    const input = { id: customer.id };
    const full = unwrap({ result: await execute({ operation: getCustomer, input, context }) });
    expect(full.orderCount).toBe(1);
    const blind = { ...context, permissions: withoutOrders };
    const hidden = unwrap({
      result: await execute({ operation: getCustomer, input, context: blind }),
    });
    expect(hidden.orderCount).toBeNull();
  });

  it("says only that the customer is in use when its orders are hidden", async () => {
    const { context, type, customer } = await orderSetup();
    await createTestOrder({ context, entityTypeId: type.id, customerId: customer.id });
    await archiveContactsOf({ customerId: customer.id });
    const input = { id: customer.id };
    const detailed = await execute({ operation: archiveCustomer, input, context });
    expect(detailed).toMatchObject({ ok: false, error: { code: "CONFLICT" } });
    expect(detailed.ok ? "" : detailed.error.message).toContain("1 orders");
    const blind = { ...context, permissions: withoutOrders };
    const neutral = await execute({ operation: archiveCustomer, input, context: blind });
    expect(neutral).toMatchObject({
      ok: false,
      error: { code: "CONFLICT", message: "It is still in use" },
    });
  });
});
