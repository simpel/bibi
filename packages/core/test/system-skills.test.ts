import { getDb } from "@bibi/db";
import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { execute, getSkill, listSkills, publishSkill, updateSkill } from "../src/index";
import { seedSystemSkills } from "../src/skills/seed-system-skills";
import { upsertSystemSkill } from "../src/skills/upsert-system-skill";
import { errorCode, testContext, unwrap } from "./helpers";

const content = ({ slug, text }: { slug: string; text: string }) => ({
  slug,
  name: "Test system skill",
  description: "Only for tests",
  instructions: text,
  allowedTools: ["search"],
  resources: [],
});

describe("SYSTEM skills", () => {
  it("seeds the shipped SKILL.md files idempotently", async () => {
    unwrap({ result: await seedSystemSkills() });
    const again = unwrap({ result: await seedSystemSkills() });
    expect(again.created).toEqual([]);
    expect(again.updated).toEqual([]);
    expect(again.unchanged).toEqual(
      expect.arrayContaining([
        "create-venue-with-items",
        "find-available-space",
        "propose-configuration",
        "summarize-ticket-risks",
      ]),
    );
  });

  it("limits propose-configuration to configuration tools", async () => {
    unwrap({ result: await seedSystemSkills() });
    const page = unwrap({
      result: await execute({
        operation: listSkills,
        input: { q: "propose-configuration" },
        context: testContext(),
      }),
    });
    const skill = page.items.find((item) => item.slug === "propose-configuration");
    expect(skill?.allowedTools).toEqual(
      expect.arrayContaining(["configuration_importTemplate", "entityType_create"]),
    );
    const writes = (skill?.allowedTools ?? []).filter((tool) => /_(create|import)/.test(tool));
    expect(writes.length).toBeGreaterThan(0);
    for (const tool of skill?.allowedTools ?? []) {
      expect(tool).toMatch(/^(entityType|fieldDefinition|vocabulary|setup|configuration)_/);
    }
  });

  it("bumps the version only when the content changes", async () => {
    const db = getDb();
    const slug = `test-${createId()}`;
    const source = `system:${slug}.md`;
    expect(await upsertSystemSkill({ db, source, content: content({ slug, text: "v1" }) })).toBe(
      "created",
    );
    expect(await upsertSystemSkill({ db, source, content: content({ slug, text: "v1" }) })).toBe(
      "unchanged",
    );
    expect(await upsertSystemSkill({ db, source, content: content({ slug, text: "v2" }) })).toBe(
      "updated",
    );
    const row = await db.skill.findFirstOrThrow({ where: { source } });
    expect(row).toMatchObject({
      scope: "SYSTEM",
      organizationId: null,
      version: 2,
      status: "PUBLISHED",
    });
    await db.skill.update({ where: { id: row.id }, data: { status: "ARCHIVED" } });
  });

  it("is readable by every organization and immutable through operations", async () => {
    unwrap({ result: await seedSystemSkills() });
    const orgA = testContext();
    const orgB = testContext();
    const listed = async ({ context }: { context: typeof orgA }) =>
      unwrap({
        result: await execute({
          operation: listSkills,
          input: { scope: "SYSTEM", limit: 100 },
          context,
        }),
      }).items.map((item) => item.slug);
    expect(await listed({ context: orgA })).toContain("create-venue-with-items");
    expect(await listed({ context: orgB })).toContain("create-venue-with-items");
    const page = unwrap({
      result: await execute({
        operation: listSkills,
        input: { q: "create-venue-with-items" },
        context: orgA,
      }),
    });
    const system = page.items.find((item) => item.slug === "create-venue-with-items");
    expect(system?.allowedTools).toContain("venue_create");
    const id = system?.id ?? "";
    expect(
      errorCode({ result: await execute({ operation: getSkill, input: { id }, context: orgB }) }),
    ).toBeNull();
    for (const operation of [updateSkill, publishSkill]) {
      const result = await execute({ operation, input: { id }, context: orgA });
      expect(errorCode({ result })).toBe("FORBIDDEN");
    }
  });

  it("cannot be created, changed or deleted through the scoped client", async () => {
    unwrap({ result: await seedSystemSkills() });
    const { db } = testContext();
    const systemRows = await db.skill.findMany({ where: { scope: "SYSTEM" } });
    expect(systemRows.length).toBeGreaterThan(0);
    const updated = await db.skill.updateMany({
      where: { scope: "SYSTEM" },
      data: { name: "Hacked" },
    });
    expect(updated.count).toBe(0);
    const deleted = await db.skill.deleteMany({ where: { scope: "SYSTEM" } });
    expect(deleted.count).toBe(0);
    await expect(
      db.skill.update({ where: { id: systemRows[0]?.id ?? "" }, data: { name: "Hacked" } }),
    ).rejects.toThrow();
    const spoof = { slug: `x-${createId()}`, name: "S", description: "D", instructions: "I" };
    await expect(
      db.skill.create({ data: { ...spoof, scope: "SYSTEM", organizationId: null } }),
    ).rejects.toThrow();
    const unchanged = await getDb().skill.count({ where: { scope: "SYSTEM", name: "Hacked" } });
    expect(unchanged).toBe(0);
  });
});
