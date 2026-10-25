import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

type Client = Awaited<ReturnType<typeof connect>>;
type SettingsInput = { client: Client };

const settingsOf = async ({ client }: SettingsInput) =>
  (await call({ client, name: "userSettings_get", args: {} })).data;

describe("user settings isolation (ADR 0046)", () => {
  it("keeps each user's settings private, in the same and in other organizations", async () => {
    const contextA = testContext({ permissions: {} });
    const a = await connect({ context: contextA });
    const sameOrgAdmin = await connect({
      context: testContext({ organizationId: contextA.organizationId }),
    });
    const otherOrg = await connect({ context: testContext() });
    await call({
      client: a,
      name: "userSettings_update",
      args: { dateFormat: "YYYY_MM_DD", clockFormat: "H12" },
    });
    expect(await settingsOf({ client: a })).toMatchObject({
      dateFormat: "YYYY_MM_DD",
      clockFormat: "H12",
    });
    for (const client of [sameOrgAdmin, otherOrg]) {
      expect(await settingsOf({ client })).toMatchObject({ dateFormat: null, clockFormat: null });
    }
    const graph = await call({
      client: sameOrgAdmin,
      name: "graphql_query",
      args: { query: "query { userSettings { dateFormat clockFormat } }" },
    });
    expect(graph.data.data.userSettings.dateFormat).toBeNull();
    await call({
      client: sameOrgAdmin,
      name: "userSettings_update",
      args: { dateFormat: "DD_MM_YYYY" },
    });
    expect((await settingsOf({ client: a })).dateFormat).toBe("YYYY_MM_DD");
    expect((await settingsOf({ client: sameOrgAdmin })).dateFormat).toBe("DD_MM_YYYY");
  });
});
