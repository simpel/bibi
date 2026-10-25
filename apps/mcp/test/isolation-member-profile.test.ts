import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { createRestClient } from "./parity-rest";
import { seedOrgMember } from "./seed-org-member";

/** Organization A: a member linked to one staff item (ADR 0068). */
async function setup() {
  const contextA = testContext();
  const contextB = testContext();
  const a = await connect({ context: contextA });
  const b = await connect({ context: contextB });
  const member = await seedOrgMember({ context: contextA });
  const memberB = await seedOrgMember({ context: contextB });
  const type = await call({
    client: a,
    name: "entityType_create",
    args: { base: "ITEM", name: "Secret crew", capabilities: ["BOOKABLE"], resourceKind: "PERSON" },
  });
  const item = await call({
    client: a,
    name: "item_create",
    args: { entityTypeId: type.data.id, name: "Secret staff" },
  });
  const linked = await call({
    client: a,
    name: "memberProfile_setItems",
    args: { memberId: member.id, itemIds: [item.data.id] },
  });
  expect(linked.isError, JSON.stringify(linked.data)).toBe(false);
  return { contextB, b, memberB, memberId: member.id, itemId: item.data.id as string };
}

describe("cross-organization isolation: member profiles", () => {
  it("hides and protects one organization's member profiles", async () => {
    const { contextB, b, memberId, itemId } = await setup();
    for (const [name, args] of [
      ["memberProfile_get", { memberId }],
      ["memberProfile_update", { memberId, scheduleKind: "CASUAL" }],
      ["memberProfile_setItems", { memberId, itemIds: [] }],
    ] as const) {
      expect((await call({ client: b, name, args })).data.code, name).toBe("NOT_FOUND");
    }
    const list = await call({ client: b, name: "memberProfile_list", args: { limit: 50 } });
    expect(list.data.items).toEqual([]);
    const byItem = await call({
      client: b,
      name: "memberProfile_list",
      args: { limit: 50, itemIds: [itemId], memberIds: [memberId] },
    });
    expect(byItem.data.items).toEqual([]);
    const rest = createRestClient({ context: contextB });
    expect(await rest.send({ method: "GET", path: `/members/${memberId}/profile` })).toBe(404);
  });

  it("never links another organization's staff item to an own member", async () => {
    const { b, memberB: own, itemId } = await setup();
    const result = await call({
      client: b,
      name: "memberProfile_setItems",
      args: { memberId: own.id, itemIds: [itemId] },
    });
    expect(result.isError).toBe(true);
    expect(["NOT_FOUND", "VALIDATION"]).toContain(result.data.code);
    const mine = await call({ client: b, name: "memberProfile_get", args: { memberId: own.id } });
    expect(mine.data.items).toEqual([]);
  });
});
