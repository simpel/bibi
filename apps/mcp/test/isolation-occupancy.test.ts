import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedProgram } from "./seed-program";

const period = { startsAt: "2026-11-02T07:00:00.000Z", endsAt: "2026-11-02T09:00:00.000Z" };

describe("cross-organization isolation: occupancy", () => {
  it("hides one organization's occupancies and refuses to block its items", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const { itemId } = await seedProgram({ client: a });
    const made = await call({
      client: a,
      name: "occupancy_create",
      args: { itemId, type: "MAINTENANCE", note: "Service", ...period },
    });
    expect(made.isError, JSON.stringify(made.data)).toBe(false);
    const id = made.data.id;

    for (const [name, args] of [
      ["occupancy_get", { id }],
      ["occupancy_update", { id, note: "Hacked" }],
      ["occupancy_archive", { id }],
    ] as const) {
      const result = await call({ client: b, name, args });
      expect(result.data.code, name).toBe("NOT_FOUND");
    }
    const blocked = await call({
      client: b,
      name: "occupancy_create",
      args: { itemId, type: "INTERNAL", ...period },
    });
    expect(["NOT_FOUND", "VALIDATION"]).toContain(blocked.data.code);
    expect((await call({ client: b, name: "occupancy_list" })).data.items).toEqual([]);
    const byItem = await call({ client: b, name: "occupancy_list", args: { itemId } });
    expect(byItem.data.items).toEqual([]);

    const own = await call({ client: a, name: "occupancy_get", args: { id } });
    expect(own.data.note).toBe("Service");
    expect(own.data.status).toBe("ACTIVE");
    const listed = await call({
      client: a,
      name: "occupancy_list",
      args: { itemId, type: "MAINTENANCE" },
    });
    expect(listed.data.items).toHaveLength(1);
  });
});
