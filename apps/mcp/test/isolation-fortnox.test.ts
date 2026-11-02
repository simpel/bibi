import { randomBytes } from "node:crypto";
import { getEnv } from "@bibi/config";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { call, connect, testContext } from "./helpers";

const KEYS = ["FORTNOX_CLIENT_ID", "FORTNOX_CLIENT_SECRET", "INTEGRATION_SECRET_KEY"] as const;
const saved = Object.fromEntries(KEYS.map((key) => [key, getEnv()[key]]));

beforeEach(() => {
  Object.assign(getEnv(), {
    FORTNOX_CLIENT_ID: "client-id",
    FORTNOX_CLIENT_SECRET: "client-secret",
    INTEGRATION_SECRET_KEY: randomBytes(32).toString("base64"),
  });
});
afterEach(() => {
  Object.assign(getEnv(), saved);
});

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
    expect(own.data.items[0].id).toBe(started.data.id);
    expect(own.data.items[0].organizationId).toBe(contextA.organizationId);

    const other = await call({ client: b, name: "integration_list" });
    expect(other.data.items).toHaveLength(1);
    expect(other.data.items[0].id).toBeNull();
    expect(other.data.items[0].status).toBe("NOT_CONNECTED");
    expect(other.data.items[0].organizationId).toBe(contextB.organizationId);
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
    expect(aList.data.items[0].status).toBe("DISCONNECTED");
    const bList = await call({ client: b, name: "integration_list" });
    expect(bList.data.items[0].id).toBe(bStarted.data.id);
    expect(bList.data.items[0].status).toBe("PENDING");
  });
});
