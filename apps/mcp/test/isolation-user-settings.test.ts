import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

type StatusInput = { client: Awaited<ReturnType<typeof connect>> };

const statusOf = async ({ client }: StatusInput) =>
  (await call({ client, name: "userSettings_get", args: {} })).data.onboardingStatus;

describe("user settings isolation (ADR 0046)", () => {
  it("keeps each user's settings private, in the same and in other organizations", async () => {
    const contextA = testContext({ permissions: {} });
    const a = await connect({ context: contextA });
    const sameOrgAdmin = await connect({
      context: testContext({ organizationId: contextA.organizationId }),
    });
    const otherOrg = await connect({ context: testContext() });
    await call({ client: a, name: "userSettings_update", args: { onboardingStatus: "PENDING" } });
    expect(await statusOf({ client: a })).toBe("PENDING");
    expect(await statusOf({ client: sameOrgAdmin })).toBeNull();
    expect(await statusOf({ client: otherOrg })).toBeNull();
    const graph = await call({
      client: sameOrgAdmin,
      name: "graphql_query",
      args: { query: "query { userSettings { onboardingStatus } }" },
    });
    expect(graph.data.data.userSettings.onboardingStatus).toBeNull();
    await call({
      client: sameOrgAdmin,
      name: "userSettings_update",
      args: { onboardingStatus: "SKIPPED" },
    });
    expect(await statusOf({ client: a })).toBe("PENDING");
    expect(await statusOf({ client: sameOrgAdmin })).toBe("SKIPPED");
  });
});
