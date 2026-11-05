import { describe, expect, it } from "vitest";
import { execute, listOrders, PRESET_PERMISSIONS } from "../src/index";
import { createTestCustomer } from "./customer-helpers";
import { testContext, unwrap } from "./helpers";
import { createTestOrder, orderSetup } from "./order-helpers";

type ListInput = Record<string, unknown>;

async function fiveOrders() {
  const setup = await orderSetup();
  const { context, type, customer } = setup;
  const other = await createTestCustomer({ context, name: "Kvarnby Design AB" });
  for (const [index, customerId] of [
    customer.id,
    other.id,
    customer.id,
    other.id,
    customer.id,
  ].entries()) {
    await createTestOrder({
      context,
      entityTypeId: type.id,
      customerId,
      estimatedHeadcount: index,
    });
  }
  const list = async ({ input, as = context }: { input: ListInput; as?: typeof context }) =>
    unwrap({ result: await execute({ operation: listOrders, input, context: as }) });
  return { ...setup, other, list };
}

describe("order.list paging, search and sort", () => {
  it("pages by number with the total, and by cursor without it", async () => {
    const { list } = await fiveOrders();
    const second = await list({ input: { page: 2, limit: 2 } });
    expect(second.items.map((item) => item.reference)).toEqual([3, 2]);
    expect(second.total).toBe(5);
    const last = await list({ input: { page: 3, limit: 2 } });
    expect(last.items.map((item) => item.reference)).toEqual([1]);
    expect(last.nextCursor).toBeNull();
    const byCursor = await list({ input: { limit: 2 } });
    expect(byCursor.total).toBeNull();
  });

  it("searches the reference and the customer's name, and sorts by a column", async () => {
    const { list } = await fiveOrders();
    const byReference = await list({ input: { q: "#4", page: 1 } });
    expect(byReference.items.map((item) => item.reference)).toEqual([4]);
    const byCustomer = await list({ input: { q: "kvarnby", page: 1 } });
    expect(byCustomer.total).toBe(2);
    const byQuantity = await list({ input: { sort: "quantity", direction: "asc", limit: 5 } });
    expect(byQuantity.items.map((item) => item.estimatedHeadcount)).toEqual([0, 1, 2, 3, 4]);
  });

  it("never matches or sorts by customer names the caller may not view (ADR 0071)", async () => {
    const { context, list } = await fiveOrders();
    const blind = testContext({
      organizationId: context.organizationId,
      permissions: { ...PRESET_PERMISSIONS.admin, customer: [] },
    });
    const search = await list({ input: { q: "kvarnby", page: 1 }, as: blind });
    expect(search.total).toBe(0);
    const sorted = await list({ input: { sort: "customer", direction: "asc" }, as: blind });
    expect(sorted.items.map((item) => item.reference)).toEqual([1, 2, 3, 4, 5]);
  });
});
