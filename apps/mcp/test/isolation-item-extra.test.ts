import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

describe("cross-organization isolation: item archive, resolve and packages", () => {
  it("refuses another organization's item for archive, resolve and as package part", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const typeA = await call({
      client: a,
      name: "entityType_create",
      args: { base: "ITEM", name: "Secret dish" },
    });
    const secret = await call({
      client: a,
      name: "item_create",
      args: { entityTypeId: typeA.data.id, name: "Hemlig" },
    });
    expect(secret.isError, JSON.stringify(secret.data)).toBe(false);
    const id = secret.data.id;
    for (const name of ["item_archive", "item_resolve"]) {
      const result = await call({ client: b, name, args: { id } });
      expect(result.data.code, name).toBe("NOT_FOUND");
    }

    const customerType = await call({
      client: b,
      name: "entityType_create",
      args: { base: "CUSTOMER", name: "Company" },
    });
    const customer = await call({
      client: b,
      name: "customer_create",
      args: { entityTypeId: customerType.data.id, name: "Own customer" },
    });
    expect(customer.isError, JSON.stringify(customer.data)).toBe(false);
    const packageType = await call({
      client: b,
      name: "entityType_create",
      args: { base: "ITEM", name: "Package", behaviours: ["COMPOSABLE"] },
    });
    const saved = await call({
      client: b,
      name: "item_saveAsPackage",
      args: {
        customerId: customer.data.id,
        entityTypeId: packageType.data.id,
        name: "Borrowing",
        components: [{ itemId: id }],
      },
    });
    expect(saved.isError).toBe(true);
    expect(["NOT_FOUND", "VALIDATION"]).toContain(saved.data.code);
    const listed = await call({ client: b, name: "item_list" });
    expect(listed.data.items).toEqual([]);

    const ownerSave = await call({
      client: a,
      name: "item_saveAsPackage",
      args: {
        customerId: customer.data.id,
        entityTypeId: typeA.data.id,
        name: "Foreign customer",
        components: [{ itemId: id }],
      },
    });
    expect(ownerSave.isError).toBe(true);
    expect(["NOT_FOUND", "VALIDATION"]).toContain(ownerSave.data.code);

    const resolved = await call({ client: a, name: "item_resolve", args: { id } });
    expect(resolved.data.itemId).toBe(id);
    const intact = await call({ client: a, name: "item_get", args: { id } });
    expect(intact.data.status).toBe("ACTIVE");
  });
});

describe("cross-organization isolation: price list update", () => {
  it("refuses another organization's price list and keeps it unchanged", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const list = await call({ client: a, name: "priceList_create", args: { name: "Secret" } });
    const update = await call({
      client: b,
      name: "priceList_update",
      args: { id: list.data.id, name: "Hacked" },
    });
    expect(update.data.code).toBe("NOT_FOUND");
    const own = await call({ client: a, name: "priceList_get", args: { id: list.data.id } });
    expect(own.data.name).toBe("Secret");
  });
});
