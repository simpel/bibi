import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

const window = { startsAt: "2026-11-01T10:00:00Z", endsAt: "2026-11-01T12:00:00Z" };

describe("cross-organization isolation: pool free units", () => {
  it("refuses another organization's item, type and list values", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const typeA = await call({
      client: a,
      name: "entityType_create",
      args: { base: "ITEM", name: "Secret kit", capabilities: ["BOOKABLE"] },
    });
    const secret = await call({
      client: a,
      name: "item_create",
      args: { entityTypeId: typeA.data.id, name: "Hemlig" },
    });
    expect(secret.isError, JSON.stringify(secret.data)).toBe(false);

    const byItem = await call({
      client: b,
      name: "item_freeUnits",
      args: { itemId: secret.data.id, ...window },
    });
    expect(byItem.data.code).toBe("NOT_FOUND");
    const byType = await call({
      client: b,
      name: "item_freeUnits",
      args: { entityTypeId: typeA.data.id, ...window },
    });
    expect(byType.data.code).toBe("NOT_FOUND");

    const own = await call({
      client: a,
      name: "item_freeUnits",
      args: { entityTypeId: typeA.data.id, ...window },
    });
    expect(own.data.prepickId).toBe(secret.data.id);
  });
});
