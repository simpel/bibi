import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

const KEY = "table.columns.isolation";

type ListInput = { client: Awaited<ReturnType<typeof connect>> };

const listValues = async ({ client }: ListInput) =>
  (await call({ client, name: "userPreference_list", args: { prefix: KEY } })).data.items.map(
    (item: { value: unknown }) => item.value,
  );

describe("user preference isolation (ADR 0039)", () => {
  it("keeps each user's preferences private, in the same and in other organizations", async () => {
    const contextA = testContext({ permissions: {} });
    const a = await connect({ context: contextA });
    const sameOrgAdmin = await connect({
      context: testContext({ organizationId: contextA.organizationId }),
    });
    const otherOrg = await connect({ context: testContext() });
    await call({ client: a, name: "userPreference_set", args: { key: KEY, value: ["a"] } });
    expect(await listValues({ client: sameOrgAdmin })).toEqual([]);
    expect(await listValues({ client: otherOrg })).toEqual([]);
    const graph = await call({
      client: sameOrgAdmin,
      name: "graphql_query",
      args: { query: "query { userPreferences { items { key } } }" },
    });
    expect(graph.data.data.userPreferences.items).toEqual([]);
    await call({
      client: sameOrgAdmin,
      name: "userPreference_set",
      args: { key: KEY, value: ["admin"] },
    });
    expect(await listValues({ client: a })).toEqual([["a"]]);
    expect(await listValues({ client: sameOrgAdmin })).toEqual([["admin"]]);
  });
});
