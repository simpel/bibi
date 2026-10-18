import { createId } from "@paralleldrive/cuid2";
import { describe, expect, it } from "vitest";
import { call, connect, type Json, testContext } from "./helpers";

const CONTENT = { description: "When to use", instructions: "Do the secret thing" };
const MARKDOWN = "---\nname: Imported\ndescription: Imported skill\n---\nBody text";

type Ids = { client: Awaited<ReturnType<typeof connect>>; scope: "PERSONAL" | "ORGANIZATION" };

async function createSkill({ client, scope }: Ids): Promise<Json> {
  const name = `Secret ${scope} ${createId()}`;
  const made = await call({ client, name: "skill_create", args: { scope, name, ...CONTENT } });
  expect(made.isError, JSON.stringify(made.data)).toBe(false);
  return made.data;
}

async function setup() {
  const a = await connect({ context: testContext() });
  const b = await connect({ context: testContext() });
  return { a, b, personal: await createSkill({ client: a, scope: "PERSONAL" }) };
}

const SKILL_TOOLS = ["skill_get", "skill_export", "skill_publish", "skill_archive", "skill_share"];

describe("cross-organization isolation: skills", () => {
  it("refuses every skill operation on another organization's skills", async () => {
    const { a, b, personal } = await setup();
    const org = await createSkill({ client: a, scope: "ORGANIZATION" });
    for (const skill of [personal, org]) {
      for (const name of SKILL_TOOLS) {
        const result = await call({ client: b, name, args: { id: skill.id } });
        expect(result.data.code, `${name} ${skill.scope}`).toBe("NOT_FOUND");
      }
      const update = await call({
        client: b,
        name: "skill_update",
        args: { id: skill.id, name: "Hacked" },
      });
      expect(update.data.code).toBe("NOT_FOUND");
    }
    const listed = await call({ client: b, name: "skill_list" });
    const ids = listed.data.items.map((item: { id: string }) => item.id);
    expect(ids).not.toContain(personal.id);
    expect(ids).not.toContain(org.id);
    for (const skill of [personal, org]) {
      const own = await call({ client: a, name: "skill_get", args: { id: skill.id } });
      expect(own.data.name).toBe(skill.name);
      expect(own.data.status).toBe("DRAFT");
    }
  });

  it("import and create in one organization leave another organization's skills alone", async () => {
    const { a, b, personal } = await setup();
    const imported = await call({ client: b, name: "skill_import", args: { markdown: MARKDOWN } });
    expect(imported.isError, JSON.stringify(imported.data)).toBe(false);
    expect(imported.data.id).not.toBe(personal.id);
    expect(imported.data.organizationId).not.toBe(personal.organizationId);
    const created = await call({
      client: b,
      name: "skill_create",
      args: { name: personal.name, slug: personal.slug, ...CONTENT },
    });
    expect(created.isError, JSON.stringify(created.data)).toBe(false);
    const mine = await call({ client: a, name: "skill_list", args: { scope: "PERSONAL" } });
    expect(mine.data.items).toHaveLength(1);
    expect(mine.data.items[0].id).toBe(personal.id);
    expect(mine.data.items[0].version).toBe(personal.version);
  });

  it("keeps a personal skill private to its owner within the same organization", async () => {
    const organizationId = `org_${createId()}`;
    const owner = await connect({ context: testContext({ organizationId }) });
    const colleague = await connect({ context: testContext({ organizationId }) });
    const personal = await createSkill({ client: owner, scope: "PERSONAL" });
    const org = await createSkill({ client: owner, scope: "ORGANIZATION" });
    const listed = await call({ client: colleague, name: "skill_list" });
    const ids = listed.data.items.map((item: { id: string }) => item.id);
    expect(ids).toContain(org.id);
    expect(ids).not.toContain(personal.id);
    for (const name of SKILL_TOOLS) {
      const result = await call({
        client: colleague,
        name,
        args: { id: personal.id },
      });
      expect(result.data.code, name).toBe("NOT_FOUND");
    }
    const update = await call({
      client: colleague,
      name: "skill_update",
      args: { id: personal.id, name: "Hacked" },
    });
    expect(update.data.code).toBe("NOT_FOUND");
    const seen = await call({ client: colleague, name: "skill_get", args: { id: org.id } });
    expect(seen.data.id).toBe(org.id);
  });
});
