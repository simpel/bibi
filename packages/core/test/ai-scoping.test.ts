import { describe, expect, it } from "vitest";
import { testContext } from "./helpers";

const skillData = { description: "D", instructions: "I", organizationId: "" };

describe("scoped client for conversations, messages and skills", () => {
  it("never returns another org's conversations, messages or skills", async () => {
    const orgA = testContext();
    const orgB = testContext();
    const userId = orgA.actor.userId ?? "";
    const conversation = await orgA.db.conversation.create({
      data: { organizationId: "", ownerUserId: userId, title: "A" },
    });
    await orgA.db.message.create({
      data: {
        organizationId: "",
        conversationId: conversation.id,
        sequence: 0,
        role: "USER",
        parts: [{ type: "text", text: "a" }],
        actorType: "USER",
      },
    });
    const orgSkill = await orgA.db.skill.create({
      data: { ...skillData, scope: "ORGANIZATION", slug: "org-a", name: "Org A" },
    });
    const personal = await orgA.db.skill.create({
      data: { ...skillData, scope: "PERSONAL", ownerUserId: userId, slug: "mine", name: "Mine" },
    });
    expect(await orgB.db.conversation.findFirst({ where: { id: conversation.id } })).toBeNull();
    expect(await orgB.db.message.count({ where: { conversationId: conversation.id } })).toBe(0);
    for (const id of [orgSkill.id, personal.id]) {
      expect(await orgB.db.skill.findUnique({ where: { id } })).toBeNull();
      expect(
        await orgB.db.skill.findFirst({ where: { id, organizationId: orgA.organizationId } }),
      ).toBeNull();
      expect(
        await orgB.db.skill.findFirst({ where: { OR: [{ id }, { organizationId: null }], id } }),
      ).toBeNull();
      const changed = await orgB.db.skill.updateMany({ where: { id }, data: { name: "x" } });
      expect(changed.count).toBe(0);
    }
    expect(await orgA.db.skill.count({ where: { id: { in: [orgSkill.id, personal.id] } } })).toBe(
      2,
    );
  });

  it("keeps messages append-only and inside their conversation's organization", async () => {
    const orgA = testContext();
    const orgB = testContext();
    const conversation = await orgA.db.conversation.create({
      data: { organizationId: "", ownerUserId: "u", title: "A" },
    });
    const message = {
      organizationId: "",
      conversationId: conversation.id,
      sequence: 0,
      role: "USER" as const,
      parts: [],
      actorType: "USER" as const,
    };
    await expect(orgB.db.message.create({ data: message })).rejects.toThrow();
    await orgA.db.message.create({ data: message });
    await expect(orgA.db.message.create({ data: message })).rejects.toThrow();
    await expect(orgA.db.message.updateMany({ data: { parts: [] } })).rejects.toThrow(
      /append-only/,
    );
    await expect(orgA.db.message.deleteMany({})).rejects.toThrow(/append-only/);
  });

  it("rejects personal skills without owner and org skills with one at the database level", async () => {
    const { db } = testContext();
    await expect(
      db.skill.create({ data: { ...skillData, scope: "PERSONAL", slug: "no-owner", name: "N" } }),
    ).rejects.toThrow();
    await expect(
      db.skill.create({
        data: { ...skillData, scope: "ORGANIZATION", ownerUserId: "u", slug: "o", name: "O" },
      }),
    ).rejects.toThrow();
  });
});
