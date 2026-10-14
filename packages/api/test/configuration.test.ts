import { describe, expect, it } from "vitest";
import { call, newOrgId } from "./helpers";

describe("configurable domain over HTTP", () => {
  it("imports the EU allergen template and reads it back", async () => {
    const org = newOrgId();
    const imported = await call({
      method: "POST",
      path: "/vocabularies/import-template",
      org,
      body: { template: "eu-14-allergens" },
    });
    expect(imported.status).toBe(201);
    const fetched = await call({ path: `/vocabularies/${imported.json.id}`, org });
    expect(fetched.status).toBe(200);
    expect(fetched.json.values).toHaveLength(14);
  });

  it("adds a field to a type and lists it per type", async () => {
    const org = newOrgId();
    const type = await call({
      method: "POST",
      path: "/entity-types",
      org,
      body: { base: "ITEM", name: "Konferensrum", behaviours: ["BOOKABLE"] },
    });
    const field = await call({
      method: "POST",
      path: `/entity-types/${type.json.id}/fields`,
      org,
      body: { name: "Yta m2", kind: "NUMBER" },
    });
    expect(field.status).toBe(201);
    const list = await call({ path: `/entity-types/${type.json.id}/fields`, org });
    expect(list.json.items.map((f: { id: string }) => f.id)).toEqual([field.json.id]);
  });

  it("rejects a price on an item type without PRICED", async () => {
    const org = newOrgId();
    const type = await call({
      method: "POST",
      path: "/entity-types",
      org,
      body: { base: "ITEM", name: "Rekvisita", behaviours: ["BOOKABLE"] },
    });
    const item = await call({
      method: "POST",
      path: "/items",
      org,
      body: { entityTypeId: type.json.id, name: "Stol", priceMinor: 1000 },
    });
    expect(item.status).toBe(400);
    expect(item.json.error.code).toBe("VALIDATION");
  });
});
