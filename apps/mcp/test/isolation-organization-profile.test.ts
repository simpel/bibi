import { describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

type Client = Awaited<ReturnType<typeof connect>>;

const profileOf = async ({ client }: { client: Client }) =>
  (await call({ client, name: "organizationProfile_get", args: {} })).data;

describe("organization profile isolation (ADR 0061)", () => {
  it("never reads or changes another organization's profile", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    await call({ client: a, name: "organizationProfile_update", args: { legalName: "A AB" } });
    await call({
      client: a,
      name: "organizationProfile_setSetupStatus",
      args: { setupStatus: "COMPLETED" },
    });
    expect(await profileOf({ client: b })).toMatchObject({ id: null, legalName: null });
    await call({ client: b, name: "organizationProfile_update", args: { legalName: "B AB" } });
    await call({
      client: b,
      name: "organizationProfile_setSetupStatus",
      args: { setupStatus: "SKIPPED" },
    });
    expect(await profileOf({ client: a })).toMatchObject({
      legalName: "A AB",
      setupStatus: "COMPLETED",
    });
    expect(await profileOf({ client: b })).toMatchObject({
      legalName: "B AB",
      setupStatus: "SKIPPED",
    });
  });
});
