import { describe, expect, it } from "vitest";
import {
  archiveRoom,
  createIndexingHook,
  createRoom,
  createSearchOperation,
  createVenue,
  type ExecuteContext,
  execute,
  indexEntity,
  roomEmbeddable,
} from "../src/index";
import { fakeEmbed } from "./fake-embed";
import { testContext, unwrap } from "./helpers";

const afterCommit = [createIndexingHook({ embed: fakeEmbed })];
const search = createSearchOperation({ embed: fakeEmbed });

type SeedInput = { context: ExecuteContext };

async function seed({ context }: SeedInput) {
  const venue = unwrap({
    result: await execute({
      operation: createVenue,
      input: { name: "Lindholmen" },
      context,
      afterCommit,
    }),
  });
  const input = {
    venueId: venue.id,
    name: "Ljusa salen",
    description: "Konferensrum med dagsljus",
  };
  const room = unwrap({
    result: await execute({ operation: createRoom, input, context, afterCommit }),
  });
  return { venue, room };
}

describe("search", () => {
  it("finds entities by keyword and meaning within the organization only", async () => {
    const orgA = testContext();
    const orgB = testContext();
    const { room } = await seed({ context: orgA });
    await seed({ context: orgB });
    const result = unwrap({
      result: await execute({
        operation: search,
        input: { query: "konferensrum dagsljus" },
        context: orgA,
      }),
    });
    expect(result.hits[0]).toMatchObject({ entityType: "room", entityId: room.id });
    expect(result.hits).toHaveLength(2);
    const roomsOnly = unwrap({
      result: await execute({
        operation: search,
        input: { query: "Lindholmen", entityTypes: ["room"] },
        context: orgA,
      }),
    });
    expect(roomsOnly.hits.every((hit) => hit.entityType === "room")).toBe(true);
  });

  it("skips unchanged content and drops archived entities", async () => {
    const context = testContext();
    const { room } = await seed({ context });
    const again = await indexEntity({
      embeddable: roomEmbeddable,
      entityId: room.id,
      db: context.db,
      embed: fakeEmbed,
    });
    expect(again).toBe("unchanged");
    await execute({ operation: archiveRoom, input: { id: room.id }, context, afterCommit });
    const result = unwrap({
      result: await execute({ operation: search, input: { query: "dagsljus" }, context }),
    });
    expect(result.hits.map((hit) => hit.entityId)).not.toContain(room.id);
  });
});
