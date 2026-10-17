import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { seedOrgMember } from "./seed-org-member";

describe("cross-organization isolation", () => {
  it("hides one organization's rows from another across curated and graph tools", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const venue = await call({ client: a, name: "venue_create", args: { name: "Secret" } });
    expect(
      (await call({ client: b, name: "venue_get", args: { id: venue.data.id } })).data.code,
    ).toBe("NOT_FOUND");
    expect((await call({ client: b, name: "venue_list" })).data.items).toEqual([]);
    const update = await call({
      client: b,
      name: "venue_update",
      args: { id: venue.data.id, name: "Hacked" },
    });
    expect(update.data.code).toBe("NOT_FOUND");
    const graph = await call({
      client: b,
      name: "graphql_query",
      args: { query: "query { venues { items { id } } }" },
    });
    expect(graph.data.data.venues.items).toEqual([]);
    const own = await call({ client: a, name: "venue_get", args: { id: venue.data.id } });
    expect(own.data.name).toBe("Secret");
    const history = { entityType: "venue", entityId: venue.data.id };
    expect((await call({ client: b, name: "auditLog_list", args: history })).data.items).toEqual(
      [],
    );
    const audit = (await call({ client: a, name: "auditLog_list", args: history })).data.items;
    expect(audit.map((row: { operation: string }) => row.operation)).toEqual(["venue.create"]);
  });

  it("hides members of one organization from another", async () => {
    const contextA = testContext();
    const contextB = testContext();
    const memberA = await seedOrgMember({ context: contextA });
    await seedOrgMember({ context: contextB });
    const a = await connect({ context: contextA });
    const b = await connect({ context: contextB });
    const own = (await call({ client: a, name: "member_list" })).data.items;
    expect(own.map((item: { id: string }) => item.id)).toContain(memberA.id);
    const members = (await call({ client: b, name: "member_list" })).data.items;
    expect(members.map((item: { id: string }) => item.id)).not.toContain(memberA.id);
    const assign = await call({
      client: b,
      name: "member_assignRole",
      args: { id: memberA.id, role: "admin" },
    });
    expect(assign.data.code).toBe("NOT_FOUND");
    const remove = await call({ client: b, name: "member_remove", args: { id: memberA.id } });
    expect(remove.data.code).toBe("NOT_FOUND");
  });

  it("hides one organization's invitations from another", async () => {
    const contextA = testContext();
    const contextB = testContext();
    await seedOrgMember({ context: contextA });
    await seedOrgMember({ context: contextB });
    const a = await connect({ context: contextA });
    const b = await connect({ context: contextB });
    const invited = await call({
      client: a,
      name: "member_invite",
      args: { email: "secret@x.test", role: "viewer" },
    });
    expect(invited.data.status).toBe("pending");
    expect((await call({ client: b, name: "member_listInvitations" })).data.items).toEqual([]);
    const cancel = await call({
      client: b,
      name: "member_cancelInvitation",
      args: { id: invited.data.id },
    });
    expect(cancel.data.code).toBe("NOT_FOUND");
  });

  it("hides one organization's configuration and items from another", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    const type = await call({
      client: a,
      name: "entityType_create",
      args: { base: "ITEM", name: "Secret room", behaviours: ["BOOKABLE"] },
    });
    const list = await call({
      client: a,
      name: "vocabulary_create",
      args: { name: "Secret list", values: ["X"] },
    });
    const item = await call({
      client: a,
      name: "item_create",
      args: { entityTypeId: type.data.id, name: "Hemlig" },
    });
    for (const name of ["entityType_list", "vocabulary_list", "item_list", "setup_list"]) {
      expect((await call({ client: b, name })).data.items, name).toEqual([]);
    }
    for (const [name, id] of [
      ["entityType_get", type.data.id],
      ["vocabulary_get", list.data.id],
      ["item_get", item.data.id],
    ]) {
      expect((await call({ client: b, name, args: { id } })).data.code, name).toBe("NOT_FOUND");
    }
    const borrowed = await call({
      client: b,
      name: "item_create",
      args: { entityTypeId: type.data.id, name: "Borrowed type" },
    });
    expect(borrowed.data.code).toBe("VALIDATION");
    const value = await call({
      client: b,
      name: "vocabulary_archiveValue",
      args: { id: list.data.values[0].id },
    });
    expect(value.data.code).toBe("NOT_FOUND");
    const graph = await call({
      client: b,
      name: "graphql_query",
      args: { query: "query { items { items { id } } entityTypes { items { id } } }" },
    });
    expect(graph.data.data).toEqual({ items: { items: [] }, entityTypes: { items: [] } });
  });
});
