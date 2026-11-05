import { getDb } from "@bibi/db";
import { describe, expect, it } from "vitest";
import { archiveCustomer, type ExecuteContext, execute, getOrder, grantAll } from "../src/index";
import { archiveContactsOf } from "./contact-archive-helpers";
import { errorCode, testContext, unwrap } from "./helpers";
import { createTestOrder, placeInStatus, orderSetup } from "./order-helpers";
import { statuses } from "./order-status-helpers";

type OrdersInput = { context: ExecuteContext; entityTypeId: string; customerId: string };

/** One order in each status (Lead, Confirmed, Completed, Lost). */
async function orderPerStatus({ context, ...input }: OrdersInput): Promise<string[]> {
  const ids: string[] = [];
  for (const orderStatus of await statuses({ context })) {
    const order = await createTestOrder({ context, ...input });
    // Placed directly: the status rules are not what this test is about.
    await placeInStatus({ order, statusId: orderStatus.id });
    ids.push(order.id);
  }
  return ids;
}

async function setupWithOrders() {
  const setup = await orderSetup();
  const { context, type, customer } = setup;
  const ids = await orderPerStatus({ context, entityTypeId: type.id, customerId: customer.id });
  await archiveContactsOf({ customerId: customer.id });
  return { ...setup, ids };
}

const archivedStatus = async ({ ids }: { ids: string[] }) =>
  (await getDb().order.findMany({ where: { id: { in: ids } } })).map((row) => row.status);

describe("customer.archive with the customer's orders (#134)", () => {
  it("is blocked by orders in every status, with the count, unless archiveOrders is set", async () => {
    const { context, customer, ids } = await setupWithOrders();
    expect(ids).toHaveLength(4);
    const refused = await execute({
      operation: archiveCustomer,
      input: { id: customer.id },
      context,
    });
    expect(errorCode({ result: refused })).toBe("CONFLICT");
    if (refused.ok) throw new Error("expected a conflict");
    expect(refused.error.message).toContain("4 orders");
    expect(refused.error.issues).toEqual([
      expect.objectContaining({ path: "archiveOrders", message: expect.stringContaining("4") }),
    ]);
    expect(await archivedStatus({ ids })).toEqual(["ACTIVE", "ACTIVE", "ACTIVE", "ACTIVE"]);
  });

  it("archives the customer and all its orders, with one audit row each", async () => {
    const { context, customer, ids } = await setupWithOrders();
    const archived = unwrap({
      result: await execute({
        operation: archiveCustomer,
        input: { id: customer.id, archiveOrders: true },
        context,
      }),
    });
    expect(archived).toMatchObject({ status: "ARCHIVED", orderCount: 0 });
    expect(await archivedStatus({ ids })).toEqual(Array(4).fill("ARCHIVED"));
    const gone = await execute({ operation: getOrder, input: { id: ids[0] ?? "" }, context });
    expect(errorCode({ result: gone })).toBe("NOT_FOUND");
    const audit = await getDb().auditLog.findMany({
      where: { organizationId: context.organizationId, operation: "customer.archive" },
    });
    const rows = audit.map((row) => [row.entityType, row.entityId]);
    expect(rows).toHaveLength(5);
    expect(rows).toEqual(
      expect.arrayContaining([["customer", customer.id], ...ids.map((id) => ["order", id])]),
    );
    const orderRow = audit.find((row) => row.entityId === ids[0]);
    expect(orderRow?.before).toMatchObject({ status: "ACTIVE" });
    expect(orderRow?.after).toMatchObject({ status: "ARCHIVED" });
  });

  it("never touches another organization's orders", async () => {
    const own = await setupWithOrders();
    const other = await setupWithOrders();
    unwrap({
      result: await execute({
        operation: archiveCustomer,
        input: { id: own.customer.id, archiveOrders: true },
        context: own.context,
      }),
    });
    expect(await archivedStatus({ ids: other.ids })).toEqual(Array(4).fill("ACTIVE"));
    const foreign = await execute({
      operation: archiveCustomer,
      input: { id: other.customer.id, archiveOrders: true },
      context: own.context,
    });
    expect(errorCode({ result: foreign })).toBe("NOT_FOUND");
    expect(await archivedStatus({ ids: other.ids })).toEqual(Array(4).fill("ACTIVE"));
  });

  it("needs order:write to archive the orders and then changes nothing", async () => {
    const { context, customer, ids } = await setupWithOrders();
    const permissions = { ...grantAll({}), order: ["read" as const] };
    const reader = testContext({ organizationId: context.organizationId, permissions });
    const refused = await execute({
      operation: archiveCustomer,
      input: { id: customer.id, archiveOrders: true },
      context: reader,
    });
    expect(errorCode({ result: refused })).toBe("FORBIDDEN");
    expect(await archivedStatus({ ids })).toEqual(Array(4).fill("ACTIVE"));
  });

  it("ignores orders that are already archived", async () => {
    const { context, customer, ids } = await setupWithOrders();
    await getDb().order.updateMany({ where: { id: { in: ids } }, data: { status: "ARCHIVED" } });
    const archived = await execute({
      operation: archiveCustomer,
      input: { id: customer.id },
      context,
    });
    expect(errorCode({ result: archived })).toBeNull();
  });
});
