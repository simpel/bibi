import { type CapturedLogs, captureLogs } from "@bibi/logger";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createIndexingHook,
  createVenue,
  type EmbedFn,
  execute,
  indexEntity,
  updateVenue,
  venueEmbeddable,
} from "../src/index";
import { fakeEmbed } from "./fake-embed";
import { testContext, unwrap } from "./helpers";

const failingEmbed: EmbedFn = async () => {
  throw new Error("embedding provider down");
};
const failingHook = [createIndexingHook({ embed: failingEmbed })];

let logs: CapturedLogs;

beforeEach(() => {
  logs = captureLogs();
});

afterEach(() => logs.restore());

describe("search indexing is failure-safe (ADR 0030)", () => {
  it("keeps a committed command successful and logs search.index_failed", async () => {
    const context = testContext();
    const result = await execute({
      operation: createVenue,
      input: { name: "Unindexed" },
      context,
      afterCommit: failingHook,
    });
    const venue = unwrap({ result });
    expect(await context.db.venue.findFirst({ where: { id: venue.id } })).not.toBeNull();
    expect(await context.db.embedding.findFirst({ where: { entityId: venue.id } })).toBeNull();
    expect(logs.events({ event: "search.index_failed" })).toEqual([
      expect.objectContaining({
        level: "error",
        operation: "venue.create",
        organizationId: context.organizationId,
        entityType: "venue",
        entityId: venue.id,
      }),
    ]);
    expect(logs.events({ event: "operation.completed" })).toEqual([
      expect.objectContaining({ operation: "venue.create", level: "info" }),
    ]);
    expect(JSON.stringify(logs.entries())).not.toContain("Unindexed");
  });

  it("leaves an out-of-date row after a failed update that a later index run repairs", async () => {
    const context = testContext();
    const ok = [createIndexingHook({ embed: fakeEmbed })];
    const input = { name: "Old name" };
    const venue = unwrap({
      result: await execute({ operation: createVenue, input, context, afterCommit: ok }),
    });
    const renamed = await execute({
      operation: updateVenue,
      input: { id: venue.id, name: "New name" },
      context,
      afterCommit: failingHook,
    });
    expect(renamed.ok).toBe(true);
    const row = () => context.db.embedding.findFirst({ where: { entityId: venue.id } });
    expect((await row())?.content).toContain("Old name");
    const args = { embeddable: venueEmbeddable, entityId: venue.id, db: context.db };
    expect(await indexEntity({ ...args, embed: fakeEmbed })).toBe("indexed");
    expect((await row())?.content).toContain("New name");
  });
});
