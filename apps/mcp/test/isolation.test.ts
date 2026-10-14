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
  });

  it("hides roles and members of one organization from another", async () => {
    const contextA = testContext();
    const contextB = testContext();
    const memberA = await seedOrgMember({ context: contextA });
    await seedOrgMember({ context: contextB });
    const a = await connect({ context: contextA });
    const b = await connect({ context: contextB });
    const role = await call({
      client: a,
      name: "role_create",
      args: { name: "Hemlig", permissions: { venue: ["read"] } },
    });
    expect(
      (await call({ client: b, name: "role_get", args: { id: role.data.id } })).data.code,
    ).toBe("NOT_FOUND");
    const names = (await call({ client: b, name: "role_list" })).data.items.map(
      (item: { name: string }) => item.name,
    );
    expect(names).toEqual(["owner"]);
    const members = (await call({ client: b, name: "member_list" })).data.items;
    expect(members.map((item: { id: string }) => item.id)).not.toContain(memberA.id);
    const assign = await call({
      client: b,
      name: "member_assignRole",
      args: { id: memberA.id, roles: ["Hemlig"] },
    });
    expect(assign.data.code).toBe("NOT_FOUND");
    const archive = await call({ client: b, name: "role_archive", args: { id: role.data.id } });
    expect(archive.data.code).toBe("NOT_FOUND");
  });
});
