import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

const WALLS = { widthCm: 800, depthCm: 600, outline: [], minAisleCm: null };

describe("cross-organization isolation: floor plans and layouts", () => {
  it("hides another organization's kinds, plans and layouts and leaves them unchanged", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const kind = await call({
      client: a,
      name: "floorElementKind_create",
      args: { name: "Secret table", shape: "RECT", widthCm: 180, depthCm: 80 },
    });
    expect(kind.isError, JSON.stringify(kind.data)).toBe(false);
    const type = await call({
      client: a,
      name: "entityType_create",
      args: { base: "ITEM", name: "Secret room", capabilities: ["BOOKABLE", "SETUPS"] },
    });
    const setup = await call({ client: a, name: "setup_create", args: { name: "Secret banquet" } });
    const item = await call({
      client: a,
      name: "item_create",
      args: {
        entityTypeId: type.data.id,
        name: "Secret hall",
        setups: [{ setupId: setup.data.id, capacity: null }],
      },
    });
    expect(item.isError, JSON.stringify(item.data)).toBe(false);
    const itemId = item.data.id;
    const setupId = setup.data.id;
    const id = kind.data.id;
    const outline = [
      [0, 0],
      [800, 0],
      [800, 600],
      [0, 600],
    ];

    const steps = [
      ["floorElementKind_get", { id }],
      ["floorElementKind_update", { id, name: "Hacked" }],
      ["floorElementKind_archive", { id }],
      ["floorPlan_get", { itemId }],
      ["floorPlan_save", { itemId, ...WALLS, outline, expectedVersion: 0, elements: [] }],
      ["setupLayout_get", { itemId, setupId }],
      ["setupLayout_save", { itemId, setupId, expectedVersion: 0, elements: [] }],
    ] as const;
    for (const [name, args] of steps) {
      const result = await call({ client: b, name, args });
      expect(result.data.code, name).toBe("NOT_FOUND");
    }

    const listed = await call({ client: b, name: "floorElementKind_list", args: {} });
    expect(listed.data.items, "list leaves A's kind out").toEqual([]);
    const imported = await call({
      client: b,
      name: "floorElementKind_importTemplate",
      args: { template: "conference-banquet" },
    });
    expect(imported.isError, JSON.stringify(imported.data)).toBe(false);
    const ownKind = await call({ client: a, name: "floorElementKind_get", args: { id } });
    expect(ownKind.data.name, "kind unchanged").toBe("Secret table");
    expect(ownKind.data.status).toBe("ACTIVE");
    const ownPlan = await call({ client: a, name: "floorPlan_get", args: { itemId } });
    expect(ownPlan.data.version, "plan unchanged").toBe(0);
  });
});
