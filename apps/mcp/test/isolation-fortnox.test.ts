import { randomBytes } from "node:crypto";
import { getEnv } from "@bibi/config";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

const KEYS = [
  "FORTNOX_CLIENT_ID",
  "FORTNOX_CLIENT_SECRET",
  "FORTNOX_AUTH_BASE_URL",
  "FORTNOX_API_BASE_URL",
  "INTEGRATION_SECRET_KEY",
] as const;
const saved = Object.fromEntries(KEYS.map((key) => [key, getEnv()[key]]));

beforeEach(() => {
  Object.assign(getEnv(), {
    FORTNOX_CLIENT_ID: "client-id",
    FORTNOX_CLIENT_SECRET: "client-secret",
    FORTNOX_AUTH_BASE_URL: "https://apps.fortnox.se",
    FORTNOX_API_BASE_URL: "https://api.fortnox.se",
    INTEGRATION_SECRET_KEY: randomBytes(32).toString("base64"),
  });
});
afterEach(() => {
  Object.assign(getEnv(), saved);
});

type Listed = {
  items: { provider: string; id: string | null; status: string; organizationId: string }[];
};

/** The Fortnox row of an integration_list result (it lists every provider, ADR 0100). */
const fortnoxOf = ({ list }: { list: Listed }) =>
  list.items.find((item) => item.provider === "FORTNOX");

describe("cross-organization isolation: Fortnox connection", () => {
  it("lists and disconnects only the caller's own connection", async () => {
    const contextA = testContext();
    const contextB = testContext();
    const a = await connect({ context: contextA });
    const b = await connect({ context: contextB });
    const started = await call({
      client: a,
      name: "integration_connect",
      args: { provider: "FORTNOX" },
    });
    expect(started.data.organizationId).toBe(contextA.organizationId);
    expect(started.data.status).toBe("PENDING");

    const own = await call({ client: a, name: "integration_list" });
    expect(fortnoxOf({ list: own.data })?.id).toBe(started.data.id);
    expect(fortnoxOf({ list: own.data })?.organizationId).toBe(contextA.organizationId);

    const other = await call({ client: b, name: "integration_list" });
    expect(other.data.items.length).toBeGreaterThan(0);
    for (const item of other.data.items) {
      expect(item).toMatchObject({ id: null, status: "NOT_CONNECTED" });
      expect(item.organizationId).toBe(contextB.organizationId);
    }
  });

  it("checks the setup only of a connection the caller's organization has (ADR 0108)", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    await call({ client: a, name: "integration_connect", args: { provider: "FORTNOX" } });
    // A's connection is only PENDING and B has none: neither can be checked, and B's call
    // never reaches A's row.
    for (const client of [a, b]) {
      const checked = await call({
        client,
        name: "integration_checkSetup",
        args: { provider: "FORTNOX" },
      });
      expect(checked.isError, JSON.stringify(checked.data)).toBe(true);
    }
    const aList = await call({ client: a, name: "integration_list" });
    expect(fortnoxOf({ list: aList.data })?.status).toBe("PENDING");
  });

  it("disconnect in one organization leaves the other's connection alone", async () => {
    const a = await connect({ context: testContext() });
    const b = await connect({ context: testContext() });
    await call({ client: a, name: "integration_connect", args: { provider: "FORTNOX" } });
    const bStarted = await call({
      client: b,
      name: "integration_connect",
      args: { provider: "FORTNOX" },
    });
    await call({ client: a, name: "integration_disconnect", args: { provider: "FORTNOX" } });

    const aList = await call({ client: a, name: "integration_list" });
    expect(fortnoxOf({ list: aList.data })?.status).toBe("DISCONNECTED");
    const bList = await call({ client: b, name: "integration_list" });
    expect(fortnoxOf({ list: bList.data })?.id).toBe(bStarted.data.id);
    expect(fortnoxOf({ list: bList.data })?.status).toBe("PENDING");
  });
});
