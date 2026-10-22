import { getDb } from "@bibi/db";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import {
  createConversation,
  createIndexingHook,
  createSearchOperation,
  createSkill,
  type ExecuteContext,
  execute,
} from "../src/index";
import { indexSystemSkills } from "../src/skills/index-system-skills";
import { upsertSystemSkill } from "../src/skills/upsert-system-skill";
import { fakeEmbed } from "./fake-embed";
import { peer, testContext, unwrap } from "./helpers";

const afterCommit = [createIndexingHook({ embed: fakeEmbed })];
const search = createSearchOperation({ embed: fakeEmbed });

type FindInput = { context: ExecuteContext; query: string };

async function find({ context, query }: FindInput): Promise<string[]> {
  const result = unwrap({
    result: await execute({ operation: search, input: { query }, context }),
  });
  return result.hits.map((hit) => `${hit.entityType}:${hit.entityId}`);
}

describe("search over skills and conversations", () => {
  it("finds org skills for everyone, personal skills and conversations only for their owner", async () => {
    const admin = testContext({ access: "admin" });
    const member = peer({ of: admin });
    const base = { description: "Calculates catering for weddings", instructions: "Steps" };
    const orgSkill = unwrap({
      result: await execute({
        operation: createSkill,
        input: { ...base, scope: "ORGANIZATION", name: "Wedding estimate" },
        context: admin,
        afterCommit,
      }),
    });
    const personal = unwrap({
      result: await execute({
        operation: createSkill,
        input: { ...base, name: "My wedding estimate" },
        context: admin,
        afterCommit,
      }),
    });
    const conversation = unwrap({
      result: await execute({
        operation: createConversation,
        input: { title: "Wedding in June" },
        context: admin,
        afterCommit,
      }),
    });
    const adminHits = await find({ context: admin, query: "wedding" });
    expect(adminHits).toEqual(
      expect.arrayContaining([
        `skill:${orgSkill.id}`,
        `skill:${personal.id}`,
        `conversation:${conversation.id}`,
      ]),
    );
    const memberHits = await find({ context: member, query: "wedding" });
    expect(memberHits).toContain(`skill:${orgSkill.id}`);
    expect(memberHits).not.toContain(`skill:${personal.id}`);
    expect(memberHits).not.toContain(`conversation:${conversation.id}`);
    expect(await find({ context: testContext(), query: "wedding" })).toEqual([]);
  });

  it("finds globally indexed SYSTEM skills from any organization", async () => {
    const db = getDb();
    const slug = `zebrakalkyl-${createId()}`;
    const source = `system:${slug}.md`;
    const content = {
      slug,
      name: "Zebrakalkyl",
      description: "Unik testskill zebrakalkyl",
      instructions: "x",
      allowedTools: [],
      resources: [],
    };
    await upsertSystemSkill({ db, source, content });
    const row = await db.skill.findFirstOrThrow({ where: { source } });
    await indexSystemSkills({ db, embed: fakeEmbed, skillIds: [row.id] });
    expect(await find({ context: testContext(), query: "zebrakalkyl" })).toContain(
      `skill:${row.id}`,
    );
    await db.skill.update({ where: { id: row.id }, data: { status: "ARCHIVED" } });
    expect(await find({ context: testContext(), query: "zebrakalkyl" })).not.toContain(
      `skill:${row.id}`,
    );
    await indexSystemSkills({ db, embed: fakeEmbed, skillIds: [row.id] });
  });
});
