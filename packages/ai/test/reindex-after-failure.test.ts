import {
  createExecuteContext,
  createVenue,
  type EmbedFn,
  grantAll,
  updateVenue,
} from "@okazi/core";
import { getDb } from "@okazi/db";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { createEmbed } from "../src/embeddings/create-embed";
import { reindexAll } from "../src/embeddings/reindex/reindex-all";
import { runCore } from "../src/server/run-core";

const failingEmbed: EmbedFn = async () => {
  throw new Error("embedding provider down");
};

describe("reindexAll after search.index_failed (ADR 0030)", () => {
  it("indexes rows the after-commit hook failed to create or update", async () => {
    const organizationId = `org_${createId()}`;
    const context = createExecuteContext({
      organizationId,
      roles: ["admin"],
      permissions: grantAll({}),
      actor: { type: "user", userId: `user_${createId()}` },
    });
    const embed = createEmbed({ apiKey: null, nodeEnv: "test" });
    const run = { context, embed };
    const kept = await runCore({ ...run, operation: createVenue, input: { name: "Old name" } });
    if (!kept.ok) throw kept.error;
    const fail = { context, embed: failingEmbed };
    const renamed = await runCore({
      ...fail,
      operation: updateVenue,
      input: { id: kept.value.id, name: "New name" },
    });
    const missing = await runCore({ ...fail, operation: createVenue, input: { name: "Missing" } });
    if (!renamed.ok || !missing.ok) throw new Error("command failed although it committed");

    const rows = () =>
      getDb().embedding.findMany({ where: { organizationId }, orderBy: { content: "asc" } });
    expect((await rows()).map((row) => row.content)).toEqual([expect.stringContaining("Old name")]);

    const report = await reindexAll({ embed, organizationId, includeGlobal: false });
    expect(report).toMatchObject({ reembedded: 0, indexed: 2 });
    const contents = (await rows()).map((row) => row.content);
    expect(contents).toEqual([
      expect.stringContaining("Missing"),
      expect.stringContaining("New name"),
    ]);

    const again = await reindexAll({ embed, organizationId, includeGlobal: false });
    expect(again).toMatchObject({ reembedded: 0, indexed: 0 });
  });
});
