import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

type Row = { id: string };

describe("cross-organization isolation: configuration template import", () => {
  it("creates configuration for the caller only and leaves other organizations alone", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const args = { template: "conference-venue" };
    const imported = await call({ client: b, name: "configuration_importTemplate", args });
    expect(imported.isError, JSON.stringify(imported.data)).toBe(false);
    const createdIds = imported.data.created.entityTypes.map((row: Row) => row.id);
    expect(createdIds.length).toBeGreaterThan(0);

    expect((await call({ client: a, name: "vocabulary_list" })).data.items).toEqual([]);
    const typesA = await call({ client: a, name: "entityType_list" });
    expect(typesA.data.items).toEqual([]);

    const again = await call({ client: a, name: "configuration_importTemplate", args });
    expect(again.isError, JSON.stringify(again.data)).toBe(false);
    expect(again.data.created.entityTypes.length).toBeGreaterThan(0);
    expect(again.data.skipped.entityTypes).toEqual([]);
  });
});
