import { getRoleTemplate } from "@okazi/core";
import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";
import { gqlQuery } from "./parity-graphql";
import { createRestClient } from "./parity-rest";

/** What each "Conference venue" role may do, checked on every surface (ADR 0020). */
const permissionsOf = ({ name }: { name: string }) => {
  const role = getRoleTemplate({ key: "conference-venue" }).roles.find((r) => r.name === name);
  if (!role) throw new Error(`No template role ${name}`);
  return role.permissions;
};

describe("role template parity: conference-venue", () => {
  it("Kitchen reads venues but cannot write them, on MCP, REST and GraphQL", async () => {
    const context = testContext({ permissions: permissionsOf({ name: "Kitchen" }) });
    const mcp = await connect({ context });
    expect((await call({ client: mcp, name: "venue_list" })).isError).toBe(false);
    const denied = await call({ client: mcp, name: "venue_create", args: { name: "X" } });
    expect(denied.data.code).toBe("FORBIDDEN");
    expect((await createRestClient({ context }).get({ path: "/venues" })).items).toEqual([]);
    const data = await gqlQuery({ context, query: "query { venues { items { id } } }" });
    expect(data.venues.items).toEqual([]);
    await expect(
      gqlQuery({ context, query: 'mutation { venueCreate(input: { name: "X" }) { id } }' }),
    ).rejects.toThrow(/FORBIDDEN|Missing permission/);
  });

  it("only Admin may manage roles and members", async () => {
    for (const name of ["Sales", "Coordinator", "Kitchen", "Finance", "Reader"]) {
      const mcp = await connect({ context: testContext({ permissions: permissionsOf({ name }) }) });
      const result = await call({
        client: mcp,
        name: "role_create",
        args: { name: "New", permissions: {} },
      });
      expect(result.data.code, name).toBe("FORBIDDEN");
    }
    expect(permissionsOf({ name: "Admin" }).role).toEqual(["admin"]);
  });
});
