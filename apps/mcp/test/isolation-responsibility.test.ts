import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedOrgMember } from "./seed-org-member";

describe("cross-organization isolation: responsibilities", () => {
  it("hides one organization's responsibilities and refuses its members and types", async () => {
    const contextA = testContext();
    const contextB = testContext();
    const a = await connect({ context: contextA });
    const b = await connect({ context: contextB });
    const memberA = await seedOrgMember({ context: contextA });
    const memberB = await seedOrgMember({ context: contextB });
    const typeA = await call({
      client: a,
      name: "entityType_create",
      args: { base: "ITEM", name: "Secret dish" },
    });
    const made = await call({
      client: a,
      name: "responsibility_create",
      args: {
        name: "Head of kitchen",
        entityTypeIds: [typeA.data.id],
        defaultAssigneeId: memberA.userId,
      },
    });
    expect(made.isError, JSON.stringify(made.data)).toBe(false);
    const id = made.data.id;

    for (const [name, args] of [
      ["responsibility_get", { id }],
      ["responsibility_update", { id, name: "Hacked" }],
      ["responsibility_archive", { id }],
    ] as const) {
      expect((await call({ client: b, name, args })).data.code, name).toBe("NOT_FOUND");
    }
    for (const args of [
      { name: "Borrowed member", defaultAssigneeId: memberA.userId },
      { name: "Borrowed type", defaultAssigneeId: memberB.userId, entityTypeIds: [typeA.data.id] },
    ]) {
      const created = await call({ client: b, name: "responsibility_create", args });
      expect(created.isError, JSON.stringify(args)).toBe(true);
      expect(["NOT_FOUND", "VALIDATION"]).toContain(created.data.code);
    }
    const ownB = await call({
      client: b,
      name: "responsibility_create",
      args: { name: "Own", defaultAssigneeId: memberB.userId },
    });
    const stolen = await call({
      client: b,
      name: "responsibility_update",
      args: { id: ownB.data.id, defaultAssigneeId: memberA.userId },
    });
    expect(stolen.isError).toBe(true);
    const listed = await call({ client: b, name: "responsibility_list" });
    expect(listed.data.items.map((row: { id: string }) => row.id)).toEqual([ownB.data.id]);

    const own = await call({ client: a, name: "responsibility_get", args: { id } });
    expect(own.data.name).toBe("Head of kitchen");
  });
});
