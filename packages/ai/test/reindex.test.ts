import { createExecuteContext, createVenue, grantAll } from "@okazi/core";
import { EMBEDDING_DIMENSIONS, getDb, scopedDb } from "@okazi/db";
import { createId } from "@paralleldrive/cuid2";
import { MockEmbeddingModelV4 } from "ai/test";
import { describe, expect, it } from "vitest";
import { createEmbed } from "../src/embeddings/create-embed";
import { PLACEHOLDER_EMBEDDING_MODEL } from "../src/embeddings/hash-embedding";
import { reindexAll } from "../src/embeddings/reindex/reindex-all";
import { runCore } from "../src/server/run-core";

const realModel = new MockEmbeddingModelV4({
  modelId: "mock-gateway-embedding",
  maxEmbeddingsPerCall: 100,
  doEmbed: async ({ values }) => ({
    embeddings: values.map(() => new Array<number>(EMBEDDING_DIMENSIONS).fill(0.01)),
    warnings: [],
  }),
});

describe("reindexAll", () => {
  it("re-embeds rows from another model and indexes entities missing a row", async () => {
    const organizationId = `org_${createId()}`;
    const context = createExecuteContext({
      organizationId,
      roles: ["owner"],
      permissions: grantAll({ upTo: "admin" }),
      actor: { type: "user", userId: `user_${createId()}` },
    });
    const placeholder = createEmbed({ apiKey: null, nodeEnv: "test" });
    const indexed = await runCore({
      operation: createVenue,
      input: { name: "Indexerad" },
      context,
      embed: placeholder,
    });
    if (!indexed.ok) throw indexed.error;
    const missing = await scopedDb({ organizationId }).venue.create({
      data: { organizationId, name: "Saknar index" },
    });
    const embeddings = () =>
      getDb().embedding.findMany({ where: { organizationId }, orderBy: { entityId: "asc" } });
    expect((await embeddings()).map((row) => row.model)).toEqual([PLACEHOLDER_EMBEDDING_MODEL]);

    const embed = createEmbed({ model: realModel });
    const report = await reindexAll({ embed, organizationId, includeGlobal: false });
    expect(report).toEqual({
      model: "mock-gateway-embedding",
      reembedded: 1,
      indexed: 1,
      organizations: 1,
    });
    const rows = await embeddings();
    expect(rows.map((row) => row.model)).toEqual([
      "mock-gateway-embedding",
      "mock-gateway-embedding",
    ]);
    expect(rows.map((row) => row.entityId).sort()).toEqual([indexed.value.id, missing.id].sort());

    const again = await reindexAll({ embed, organizationId, includeGlobal: false });
    expect(again).toMatchObject({ reembedded: 0, indexed: 0 });
  });
});
