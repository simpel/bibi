import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedProgram } from "./seed-program";

describe("cross-organization isolation: requirements", () => {
  it("hides one organization's requirements and refuses to count on its booking", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const seed = await seedProgram({ client: a });
    const { bookingId, programItemId, requirementTypeId, valueId } = seed;
    const args = { bookingId, programItemId, entityTypeId: requirementTypeId };
    const made = await call({
      client: a,
      name: "requirement_create",
      args: { ...args, vocabularyValueId: valueId, quantity: 3 },
    });
    expect(made.isError, JSON.stringify(made.data)).toBe(false);
    const id = made.data.id;

    for (const [name, input] of [
      ["requirement_get", { id }],
      ["requirement_update", { id, quantity: 99 }],
      ["requirement_archive", { id }],
    ] as const) {
      expect((await call({ client: b, name, args: input })).data.code, name).toBe("NOT_FOUND");
    }
    const typeB = await call({
      client: b,
      name: "entityType_create",
      args: { base: "REQUIREMENT", name: "Own need" },
    });
    for (const input of [
      { ...args, vocabularyValueId: valueId, quantity: 1 },
      { ...args, entityTypeId: typeB.data.id, vocabularyValueId: valueId, quantity: 1 },
      { bookingId, entityTypeId: typeB.data.id, vocabularyValueId: valueId, quantity: 1 },
    ]) {
      const created = await call({ client: b, name: "requirement_create", args: input });
      expect(["NOT_FOUND", "VALIDATION"], JSON.stringify(input)).toContain(created.data.code);
    }
    for (const input of [{}, { bookingId }, { programItemId }, { vocabularyValueId: valueId }]) {
      const listed = await call({ client: b, name: "requirement_list", args: input });
      expect(listed.data.items).toEqual([]);
    }

    const own = await call({ client: a, name: "requirement_get", args: { id } });
    expect(own.data.quantity).toBe(3);
    const mine = await call({ client: a, name: "requirement_list", args: { bookingId } });
    expect(mine.data.items).toHaveLength(1);
  });
});
