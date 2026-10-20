import { describe, expect, it } from "vitest";
import {
  createEntityType,
  type ExecuteContext,
  execute,
  listItems,
  saveItemAsBundle,
  updateItem,
} from "../src/index";
import { createTestCustomer } from "./customer-helpers";
import { errorCode, testContext, unwrap } from "./helpers";
import { createTestItem } from "./item-helpers";

type Ctx = { context: ExecuteContext };

/** A BUNDLE + PRICED type, a plain type with two catalog items and two customers. */
async function setup({ context }: Ctx) {
  const types = await Promise.all(
    [
      { name: "Bundle", capabilities: ["BUNDLE" as const, "PRICED" as const] },
      { name: "Dish", capabilities: [] },
    ].map(async (input) =>
      unwrap({
        result: await execute({
          operation: createEntityType,
          input: { base: "ITEM", ...input },
          context,
        }),
      }),
    ),
  );
  const [pkg, dish] = types as [(typeof types)[0], (typeof types)[0]];
  const lunch = await createTestItem({ context, entityTypeId: dish.id, name: "Lunch" });
  const coffee = await createTestItem({ context, entityTypeId: dish.id, name: "Coffee" });
  const acme = await createTestCustomer({ context, name: "Acme" });
  const globex = await createTestCustomer({ context, name: "Globex" });
  return { pkg, dish, lunch, coffee, acme, globex };
}

type SaveInput = Ctx & { entityTypeId: string; customerId: string; partIds: string[] };

function save({ context, entityTypeId, customerId, partIds }: SaveInput) {
  const parts = partIds.map((itemId) => ({ itemId }));
  const input = { entityTypeId, customerId, name: "Acme day", priceMinor: 50000, parts };
  return execute({ operation: saveItemAsBundle, input, context });
}

type ListInput = Ctx & { customerId?: string; onlyCustomer?: boolean };

async function names({ context, ...input }: ListInput) {
  const page = unwrap({ result: await execute({ operation: listItems, input, context }) });
  return page.items.map((item) => item.name);
}

describe("customer-specific bundles (ADR 0021)", () => {
  it("lists a saved bundle only with its customer and leaves the catalog unchanged", async () => {
    const context = testContext();
    const { pkg, lunch, coffee, acme, globex } = await setup({ context });
    const parts = [lunch.id, coffee.id];
    const saved = unwrap({
      result: await save({ context, entityTypeId: pkg.id, customerId: acme.id, partIds: parts }),
    });
    expect(saved.customerId).toBe(acme.id);
    expect(saved.parts.map((part) => part.itemId).sort()).toEqual([...parts].sort());
    expect(await names({ context })).toEqual(["Coffee", "Lunch"]);
    expect(await names({ context, customerId: acme.id })).toEqual(["Acme day", "Coffee", "Lunch"]);
    expect(await names({ context, customerId: acme.id, onlyCustomer: true })).toEqual(["Acme day"]);
    expect(await names({ context, customerId: globex.id })).toEqual(["Coffee", "Lunch"]);
  });

  it("rejects an unknown customer, a non-BUNDLE type and no parts", async () => {
    const context = testContext();
    const { pkg, dish, lunch, acme } = await setup({ context });
    const unknown = { context, entityTypeId: pkg.id, partIds: [lunch.id] };
    expect(errorCode({ result: await save({ ...unknown, customerId: "nope" }) })).toBe(
      "VALIDATION",
    );
    const plain = { context, entityTypeId: dish.id, customerId: acme.id, partIds: [lunch.id] };
    expect(errorCode({ result: await save(plain) })).toBe("VALIDATION");
    const empty = { context, entityTypeId: pkg.id, customerId: acme.id, partIds: [] };
    expect(errorCode({ result: await save(empty) })).toBe("VALIDATION");
  });

  it("never mixes in another customer's bundle, nor puts one into the catalog", async () => {
    const context = testContext();
    const { pkg, lunch, acme, globex } = await setup({ context });
    const base = { context, entityTypeId: pkg.id };
    const acmeDay = unwrap({
      result: await save({ ...base, customerId: acme.id, partIds: [lunch.id] }),
    });
    const nested = await save({ ...base, customerId: acme.id, partIds: [acmeDay.id] });
    expect(nested.ok).toBe(true);
    const foreign = await save({ ...base, customerId: globex.id, partIds: [acmeDay.id] });
    expect(errorCode({ result: foreign })).toBe("VALIDATION");
    const catalog = await createTestItem({ context, entityTypeId: pkg.id, name: "Catalog day" });
    const leak = await execute({
      operation: updateItem,
      input: { id: catalog.id, parts: [{ itemId: acmeDay.id }] },
      context,
    });
    expect(errorCode({ result: leak })).toBe("VALIDATION");
  });

  it("does not see another organization's customer", async () => {
    const context = testContext();
    const other = testContext();
    const { pkg, lunch } = await setup({ context });
    const stranger = await createTestCustomer({ context: other, name: "Stranger" });
    const input = { context, entityTypeId: pkg.id, customerId: stranger.id, partIds: [lunch.id] };
    expect(errorCode({ result: await save(input) })).toBe("VALIDATION");
  });
});
