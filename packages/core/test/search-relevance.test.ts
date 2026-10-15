import { beforeAll, describe, expect, it } from "vitest";
import {
  createIndexingHook,
  createItem,
  createSearchOperation,
  createSkill,
  createVenue,
  type ExecuteContext,
  execute,
} from "../src/index";
import { testContext, unwrap } from "./helpers";
import { createRoomType } from "./item-helpers";
import { ITEMS, QUERIES, SKILLS, TOP_N, VENUES } from "./relevance/fixture";
import { relevanceEmbed } from "./relevance/real-embed";

const { embed, real } = relevanceEmbed();
const afterCommit = [createIndexingHook({ embed })];
const search = createSearchOperation({ embed });

type Seeded = { context: ExecuteContext; idByKey: Map<string, string> };

async function seedFixture(): Promise<Seeded> {
  const context = testContext();
  const idByKey = new Map<string, string>();
  for (const venue of VENUES) {
    const input = { name: venue.name, description: venue.description, city: venue.city };
    const created = unwrap({
      result: await execute({ operation: createVenue, input, context, afterCommit }),
    });
    idByKey.set(venue.key, created.id);
  }
  const type = await createRoomType({ context });
  for (const item of ITEMS) {
    const input = {
      entityTypeId: type.id,
      venueId: idByKey.get(item.venue),
      name: item.name,
      description: item.description,
    };
    const created = unwrap({
      result: await execute({ operation: createItem, input, context, afterCommit }),
    });
    idByKey.set(item.key, created.id);
  }
  for (const skill of SKILLS) {
    const input = { ...skill, scope: "ORGANIZATION" as const, instructions: "Steps" };
    const created = unwrap({
      result: await execute({ operation: createSkill, input, context, afterCommit }),
    });
    idByKey.set(skill.key, created.id);
  }
  return { context, idByKey };
}

describe(`search relevance (${real ? "real model" : "hash embeddings"})`, () => {
  let seeded: Seeded;
  beforeAll(async () => {
    seeded = await seedFixture();
  });

  for (const { query, expect: key, semantic } of QUERIES) {
    if (semantic && !real) continue;
    it(`ranks "${key}" in the top ${TOP_N} for "${query}"`, async () => {
      const result = unwrap({
        result: await execute({
          operation: search,
          input: { query, limit: TOP_N },
          context: seeded.context,
        }),
      });
      const expectedId = seeded.idByKey.get(key);
      expect(result.hits.map((hit) => hit.entityId)).toContain(expectedId);
    });
  }
});
