import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

type Row = { id: string; name: string };

describe("cross-organization isolation: vocabularies", () => {
  it("refuses another organization's vocabulary and values", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const vocab = await call({
      client: a,
      name: "vocabulary_create",
      args: { name: "Secret list", values: ["Alpha"] },
    });
    expect(vocab.isError, JSON.stringify(vocab.data)).toBe(false);
    const valueId = vocab.data.values[0].id;

    const cases = [
      ["vocabulary_update", { id: vocab.data.id, name: "Hacked" }],
      ["vocabulary_archive", { id: vocab.data.id }],
      ["vocabulary_addValue", { vocabularyId: vocab.data.id, name: "Injected" }],
      ["vocabulary_updateValue", { id: valueId, name: "Hacked" }],
    ] as const;
    for (const [name, args] of cases) {
      const result = await call({ client: b, name, args });
      expect(result.data.code, name).toBe("NOT_FOUND");
    }

    const own = await call({ client: a, name: "vocabulary_get", args: { id: vocab.data.id } });
    expect(own.data.status).toBe("ACTIVE");
    expect(own.data.name).toBe("Secret list");
    expect(own.data.values.map((value: Row) => value.name)).toEqual(["Alpha"]);
  });

  it("imports a template into the caller's organization only", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const imported = await call({
      client: a,
      name: "vocabulary_importTemplate",
      args: { template: "eu-14-allergens" },
    });
    expect(imported.isError, JSON.stringify(imported.data)).toBe(false);
    expect((await call({ client: b, name: "vocabulary_list" })).data.items).toEqual([]);

    const again = await call({
      client: b,
      name: "vocabulary_importTemplate",
      args: { template: "eu-14-allergens" },
    });
    expect(again.isError, JSON.stringify(again.data)).toBe(false);
    expect(again.data.id).not.toBe(imported.data.id);
    const listedA = await call({ client: a, name: "vocabulary_list" });
    const listedB = await call({ client: b, name: "vocabulary_list" });
    expect(listedA.data.items.map((row: Row) => row.id)).toEqual([imported.data.id]);
    expect(listedB.data.items.map((row: Row) => row.id)).toEqual([again.data.id]);
  });
});
