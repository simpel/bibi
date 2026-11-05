import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedProgram } from "./seed-program";

const times = { startsAt: "2037-11-03T12:00:00.000Z", endsAt: "2037-11-03T13:00:00.000Z" };

describe("cross-organization isolation: lines", () => {
  it("hides one organization's lines and refuses to add to its order", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const seed = await seedProgram({ client: a });
    const { orderId, itemId, lineId: id, programTypeId } = seed;

    for (const [name, args] of [
      ["line_get", { id }],
      ["line_update", { id, name: "Hacked" }],
      ["line_archive", { id }],
    ] as const) {
      expect((await call({ client: b, name, args })).data.code, name).toBe("NOT_FOUND");
    }
    const typeB = await call({
      client: b,
      name: "entityType_create",
      args: { base: "LINE", name: "Own session" },
    });
    for (const args of [
      { orderId, entityTypeId: typeB.data.id, name: "Intruder", ...times },
      { orderId, entityTypeId: programTypeId, name: "Intruder", ...times },
      { orderId: "x", entityTypeId: typeB.data.id, name: "Held", itemId, ...times },
    ]) {
      const created = await call({ client: b, name: "line_create", args });
      expect(["NOT_FOUND", "VALIDATION"], JSON.stringify(args)).toContain(created.data.code);
    }
    for (const args of [{}, { orderId }, { itemId }]) {
      const listed = await call({ client: b, name: "line_list", args });
      expect(listed.data.items).toEqual([]);
    }

    const own = await call({ client: a, name: "line_get", args: { id } });
    expect(own.data.name).toBe("Hidden session");
    const mine = await call({ client: a, name: "line_list", args: { orderId } });
    expect(mine.data.items.map((row: { id: string }) => row.id)).toEqual([id]);
  });
});
