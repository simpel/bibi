import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

type Row = { id: string };

describe("cross-organization isolation: setups", () => {
  it("refuses another organization's setup", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const setup = await call({ client: a, name: "setup_create", args: { name: "Secret theatre" } });
    expect(setup.isError, JSON.stringify(setup.data)).toBe(false);
    const id = setup.data.id;
    const cases = [
      ["setup_get", { id }],
      ["setup_update", { id, name: "Hacked" }],
      ["setup_archive", { id }],
    ] as const;
    for (const [name, args] of cases) {
      const result = await call({ client: b, name, args });
      expect(result.data.code, name).toBe("NOT_FOUND");
    }
    const own = await call({ client: a, name: "setup_get", args: { id } });
    expect(own.data.name).toBe("Secret theatre");
    expect(own.data.status).toBe("ACTIVE");
  });
});

describe("cross-organization isolation: configuration template import", () => {
  it("creates configuration for the caller only and leaves other organizations alone", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const own = await call({ client: a, name: "setup_create", args: { name: "Own setup" } });
    const args = { template: "conference-venue" };
    const imported = await call({ client: b, name: "configuration_importTemplate", args });
    expect(imported.isError, JSON.stringify(imported.data)).toBe(false);
    const createdIds = imported.data.created.setups.map((row: Row) => row.id);
    expect(createdIds.length).toBeGreaterThan(0);
    expect(createdIds).not.toContain(own.data.id);

    const listedA = await call({ client: a, name: "setup_list" });
    expect(listedA.data.items.map((row: Row) => row.id)).toEqual([own.data.id]);
    expect((await call({ client: a, name: "vocabulary_list" })).data.items).toEqual([]);
    const typesA = await call({ client: a, name: "entityType_list" });
    expect(typesA.data.items).toEqual([]);

    const again = await call({ client: a, name: "configuration_importTemplate", args });
    expect(again.isError, JSON.stringify(again.data)).toBe(false);
    expect(again.data.created.setups.length).toBeGreaterThan(0);
    expect(again.data.skipped.setups).toEqual([]);
  });
});
