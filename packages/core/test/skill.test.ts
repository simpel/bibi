import { describe, expect, it } from "vitest";
import {
  archiveSkill,
  createSkill,
  type ExecuteContext,
  execute,
  getSkill,
  listSkills,
  publishSkill,
  shareSkill,
  updateSkill,
} from "../src/index";
import { errorCode, peer, testContext, unwrap } from "./helpers";

type NewSkillInput = { context: ExecuteContext; scope?: "PERSONAL" | "ORGANIZATION"; name?: string };

async function newSkill({ context, scope = "PERSONAL", name = "Offertstöd" }: NewSkillInput) {
  const input = { scope, name, description: "Hjälper till med offerter", instructions: "# Steg" };
  return unwrap({ result: await execute({ operation: createSkill, input, context }) });
}

type IdsInput = { context: ExecuteContext; scope?: "SYSTEM" | "ORGANIZATION" | "PERSONAL" };

async function visibleIds({ context, scope }: IdsInput): Promise<string[]> {
  const input = { limit: 100, ...(scope ? { scope } : {}) };
  const page = unwrap({ result: await execute({ operation: listSkills, input, context }) });
  return page.items.map((item) => item.id);
}

describe("skill operations", () => {
  it("creates personal drafts, derives slugs and bumps the version on content changes", async () => {
    const context = testContext({ roles: ["member"] });
    const skill = await newSkill({ context, name: "Skapa anläggning & rum" });
    expect(skill).toMatchObject({
      scope: "PERSONAL",
      slug: "skapa-anlaggning-rum",
      status: "DRAFT",
      version: 1,
      ownerUserId: context.actor.userId,
      organizationId: context.organizationId,
    });
    const same = unwrap({
      result: await execute({ operation: updateSkill, input: { id: skill.id }, context }),
    });
    expect(same.version).toBe(1);
    const updated = unwrap({
      result: await execute({
        operation: updateSkill,
        input: { id: skill.id, allowedTools: ["venue_create"], resources: [{ name: "a.md", content: "x" }] },
        context,
      }),
    });
    expect(updated).toMatchObject({ version: 2, allowedTools: ["venue_create"] });
    const published = unwrap({ result: await execute({ operation: publishSkill, input: { id: skill.id }, context }) });
    expect(published.status).toBe("PUBLISHED");
    await execute({ operation: archiveSkill, input: { id: skill.id }, context });
    const gone = await execute({ operation: getSkill, input: { id: skill.id }, context });
    expect(errorCode({ result: gone })).toBe("NOT_FOUND");
    const again = await newSkill({ context, name: "Skapa anläggning & rum" });
    expect(again.slug).toBe("skapa-anlaggning-rum");
  });

  it("shows org skills to the org, personal skills only to their owner", async () => {
    const admin = testContext({ roles: ["admin"] });
    const member = peer({ of: admin });
    const outsider = testContext();
    const orgSkill = await newSkill({ context: admin, scope: "ORGANIZATION", name: "Org" });
    const personal = await newSkill({ context: admin, name: "Mine" });
    expect(await visibleIds({ context: admin, scope: "ORGANIZATION" })).toEqual([orgSkill.id]);
    expect(await visibleIds({ context: member, scope: "ORGANIZATION" })).toEqual([orgSkill.id]);
    expect(await visibleIds({ context: member, scope: "PERSONAL" })).toEqual([]);
    expect(await visibleIds({ context: admin, scope: "PERSONAL" })).toEqual([personal.id]);
    const outsiderIds = await visibleIds({ context: outsider });
    expect(outsiderIds).not.toContain(orgSkill.id);
    expect(outsiderIds).not.toContain(personal.id);
    for (const context of [member, outsider]) {
      const result = await execute({ operation: getSkill, input: { id: personal.id }, context });
      expect(errorCode({ result })).toBe("NOT_FOUND");
      const update = await execute({ operation: updateSkill, input: { id: personal.id, name: "x" }, context });
      expect(errorCode({ result: update })).toBe("NOT_FOUND");
    }
  });

  it("lets only admins create or change organization skills", async () => {
    const admin = testContext({ roles: ["owner"] });
    const member = peer({ of: admin });
    const input = { scope: "ORGANIZATION", name: "N", description: "D", instructions: "I" };
    const denied = await execute({ operation: createSkill, input, context: member });
    expect(errorCode({ result: denied })).toBe("FORBIDDEN");
    const orgSkill = await newSkill({ context: admin, scope: "ORGANIZATION" });
    for (const operation of [updateSkill, publishSkill, archiveSkill]) {
      const result = await execute({ operation, input: { id: orgSkill.id }, context: member });
      expect(errorCode({ result })).toBe("FORBIDDEN");
    }
    const conflict = await execute({ operation: createSkill, input, context: admin });
    expect(errorCode({ result: conflict })).toBeNull();
    const duplicate = await execute({ operation: createSkill, input, context: admin });
    expect(errorCode({ result: duplicate })).toBe("CONFLICT");
  });

  it("shares a personal skill to the organization as a draft copy (admin only)", async () => {
    const admin = testContext({ roles: ["admin"] });
    const member = peer({ of: admin });
    const mine = await newSkill({ context: member, name: "Delbar" });
    const asMember = await execute({ operation: shareSkill, input: { id: mine.id }, context: member });
    expect(errorCode({ result: asMember })).toBe("FORBIDDEN");
    const othersPersonal = await execute({ operation: shareSkill, input: { id: mine.id }, context: admin });
    expect(errorCode({ result: othersPersonal })).toBe("NOT_FOUND");
    const adminOwn = await newSkill({ context: admin, name: "Delbar" });
    const shared = unwrap({ result: await execute({ operation: shareSkill, input: { id: adminOwn.id }, context: admin }) });
    expect(shared).toMatchObject({ scope: "ORGANIZATION", status: "DRAFT", ownerUserId: null, slug: "delbar" });
    expect(shared.source).toBe(`share:${adminOwn.id}`);
    expect(await visibleIds({ context: member, scope: "ORGANIZATION" })).toEqual([shared.id]);
    const orgShare = await execute({ operation: shareSkill, input: { id: shared.id }, context: admin });
    expect(errorCode({ result: orgShare })).toBe("VALIDATION");
  });
});
