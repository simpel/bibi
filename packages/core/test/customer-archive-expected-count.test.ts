import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import { archiveCustomer, execute } from "../src/index";
import { archiveContactsOf } from "./contact-archive-helpers";
import { errorCode } from "./helpers";
import { createTestOrder, orderSetup } from "./order-helpers";

async function setupWithOrders({ count }: { count: number }) {
  const setup = await orderSetup();
  const { context, type, customer } = setup;
  for (let index = 0; index < count; index += 1)
    await createTestOrder({ context, entityTypeId: type.id, customerId: customer.id });
  return setup;
}

const activeOrders = ({ customerId }: { customerId: string }) =>
  getDb().order.count({ where: { customerId, status: "ACTIVE" } });

describe("customer.archive expectedOrderCount (#144)", () => {
  it("refuses with CONFLICT when orders were added after the approval", async () => {
    const { context, type, customer } = await setupWithOrders({ count: 2 });
    await createTestOrder({ context, entityTypeId: type.id, customerId: customer.id });
    await archiveContactsOf({ customerId: customer.id });
    const refused = await execute({
      operation: archiveCustomer,
      input: { id: customer.id, archiveOrders: true, expectedOrderCount: 2 },
      context,
    });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    if (refused.ok) throw new Error("expected a conflict");
    expect(refused.error.issues).toEqual([expect.objectContaining({ path: "expectedOrderCount" })]);
    expect(await activeOrders({ customerId: customer.id })).toBe(3);
  });

  it("archives when the count matches what was approved", async () => {
    const { context, customer } = await setupWithOrders({ count: 2 });
    await archiveContactsOf({ customerId: customer.id });
    const archived = await execute({
      operation: archiveCustomer,
      input: { id: customer.id, archiveOrders: true, expectedOrderCount: 2 },
      context,
    });
    expect(errorCode({ result: archived })).toBeNull();
    expect(await activeOrders({ customerId: customer.id })).toBe(0);
  });

  it("refuses when fewer orders remain than were approved, even none", async () => {
    const { context, customer } = await setupWithOrders({ count: 0 });
    const refused = await execute({
      operation: archiveCustomer,
      input: { id: customer.id, archiveOrders: true, expectedOrderCount: 1 },
      context,
    });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    const row = await getDb().customer.findUnique({ where: { id: customer.id } });
    expect(row?.status).toBe("ACTIVE");
  });
});
