import type { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedProgram } from "./seed-program";

async function ok({ client, name, args }: { client: Client; name: string; args: object }) {
  const result = await call({ client, name, args: args as Record<string, unknown> });
  expect(result.isError, `${name}: ${JSON.stringify(result.data)}`).toBe(false);
  return result.data;
}

/** Organization A: a Person pool of one, demanded by the seeded line's item (ADR 0059). */
async function seedAllocation({ client }: { client: Client }) {
  const seed = await seedProgram({ client });
  const pool = await ok({
    client,
    name: "entityType_create",
    args: { base: "ITEM", name: "Secret crew", capabilities: ["BOOKABLE"], resourceKind: "PERSON" },
  });
  const unit = await ok({
    client,
    name: "item_create",
    args: { entityTypeId: pool.id, name: "Secret host" },
  });
  const demand = await ok({
    client,
    name: "itemDemand_create",
    args: { itemId: seed.itemId, entityTypeId: pool.id, windows: ["BOOKING"] },
  });
  const listed = await ok({ client, name: "lineAllocation_list", args: { lineId: seed.lineId } });
  return { ...seed, poolId: pool.id, unitId: unit.id, demand, allocation: listed.items[0] };
}

describe("cross-organization isolation: demands and allocations", () => {
  it("hides one organization's demands and allocations and refuses its ids", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const seed = await seedAllocation({ client: a });
    expect(seed.allocation.unitId).toBe(seed.unitId);
    const { id } = seed.demand;
    const allocationId = seed.allocation.id;
    for (const [name, args] of [
      ["itemDemand_list", { itemId: seed.itemId }],
      ["itemDemand_get", { id }],
      ["itemDemand_update", { id, quantity: 2 }],
      ["itemDemand_archive", { id }],
      ["lineAllocation_list", { lineId: seed.lineId }],
      ["lineAllocation_get", { id: allocationId }],
      ["lineAllocation_assign", { id: allocationId, unitId: null }],
    ] as const) {
      expect((await call({ client: b, name, args })).data.code, name).toBe("NOT_FOUND");
    }
    const typeB = await call({
      client: b,
      name: "entityType_create",
      args: { base: "ITEM", name: "Own room", capabilities: ["BOOKABLE"] },
    });
    const own = await call({
      client: b,
      name: "item_create",
      args: { entityTypeId: typeB.data.id, name: "Own hall" },
    });
    for (const args of [
      { itemId: seed.itemId, entityTypeId: typeB.data.id, windows: ["BOOKING"] },
      { itemId: own.data.id, entityTypeId: seed.poolId, windows: ["BOOKING"] },
      { itemId: own.data.id, targetItemId: seed.unitId, windows: ["BOOKING"] },
    ]) {
      const created = await call({ client: b, name: "itemDemand_create", args });
      expect(created.data.code, JSON.stringify(args)).toBe("NOT_FOUND");
    }

    // B's own demand and allocation must not accept A's list values or units.
    const ownSeed = await seedAllocation({ client: b });
    const foreignTags = [
      [
        "itemDemand_create",
        {
          itemId: ownSeed.itemId,
          entityTypeId: ownSeed.poolId,
          windows: ["BOOKING"],
          tagValueIds: [seed.valueId],
        },
      ],
      ["itemDemand_update", { id: ownSeed.demand.id, tagValueIds: [seed.valueId] }],
      ["lineAllocation_assign", { id: ownSeed.allocation.id, unitId: seed.unitId }],
    ] as const;
    for (const [name, args] of foreignTags) {
      const refused = await call({ client: b, name, args });
      expect(["NOT_FOUND", "VALIDATION"], name).toContain(refused.data.code);
    }
    const kept = await call({
      client: b,
      name: "lineAllocation_get",
      args: { id: ownSeed.allocation.id },
    });
    expect(kept.data.unitId).toBe(ownSeed.unitId);

    const mine = await call({ client: a, name: "itemDemand_get", args: { id } });
    expect(mine.data.entityTypeId).toBe(seed.poolId);
  });
});
