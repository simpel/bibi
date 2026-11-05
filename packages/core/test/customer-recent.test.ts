import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import { type ExecuteContext, execute, listCustomers } from "../src/index";
import { createTestCustomer } from "./customer-helpers";
import { errorCode, testContext, unwrap } from "./helpers";
import { createTestOrder, orderSetup } from "./order-helpers";

type OrderAtInput = {
  context: ExecuteContext;
  entityTypeId: string;
  customerId: string;
  daysAgo: number;
};

/** An order for the customer, created `daysAgo` days ago. */
async function orderAt({ context, entityTypeId, customerId, daysAgo }: OrderAtInput) {
  const order = await createTestOrder({ context, entityTypeId, customerId });
  const createdAt = new Date(Date.now() - daysAgo * 86_400_000);
  await getDb().order.update({ where: { id: order.id }, data: { createdAt } });
  return order;
}

type ListInput = { context: ExecuteContext; limit?: number; cursor?: string };

const recent = async ({ context, limit = 50, cursor }: ListInput) =>
  unwrap({
    result: await execute({
      operation: listCustomers,
      input: { recent: true, limit, ...(cursor ? { cursor } : {}) },
      context,
    }),
  });

describe("customer.list with recent (ADR 0081)", () => {
  it("orders customers by their latest order, leaves out those without one and pages", async () => {
    const { context, type, customer: hisingen } = await orderSetup();
    const entityTypeId = type.id;
    const kvarnby = await createTestCustomer({ context, name: "Kvarnby Design AB" });
    const nordkust = await createTestCustomer({ context, name: "Nordkust Logistik AB" });
    await createTestCustomer({ context, name: "Never booked AB" });
    await orderAt({ context, entityTypeId, customerId: hisingen.id, daysAgo: 10 });
    await orderAt({ context, entityTypeId, customerId: kvarnby.id, daysAgo: 5 });
    await orderAt({ context, entityTypeId, customerId: hisingen.id, daysAgo: 1 });
    const archived = await orderAt({ context, entityTypeId, customerId: nordkust.id, daysAgo: 0 });
    await getDb().order.update({ where: { id: archived.id }, data: { status: "ARCHIVED" } });
    const all = await recent({ context });
    expect(all.items.map((item) => item.name)).toEqual(["Hisingen Energi AB", "Kvarnby Design AB"]);
    const first = await recent({ context, limit: 1 });
    expect(first.items.map((item) => item.id)).toEqual([hisingen.id]);
    expect(first.nextCursor).toBe(hisingen.id);
    const second = await recent({ context, limit: 1, cursor: first.nextCursor ?? "" });
    expect(second).toMatchObject({ items: [{ id: kvarnby.id }], nextCursor: null });
  });

  it("needs order:read", async () => {
    const context = testContext({ permissions: { customer: ["read"] } });
    const input = { recent: true };
    const result = await execute({ operation: listCustomers, input, context });
    expect(errorCode({ result })).toBe("FORBIDDEN");
  });
});
