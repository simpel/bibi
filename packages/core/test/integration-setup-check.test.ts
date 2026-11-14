import { describe, expect, it } from "vitest";
import {
  checkIntegrationSetup,
  completeIntegrationConnect,
  disconnectIntegration,
  execute,
  listIntegrations,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import {
  installFakeFortnox,
  sessionAdmin,
  startFortnox,
  useFortnoxEnv,
} from "./integration-helpers";

useFortnoxEnv();

const issue = { code: "ACCOUNT_MISSING" as const, account: "3001", vatPercent: null };

async function connect({ context }: { context: ReturnType<typeof sessionAdmin> }) {
  const { state } = await startFortnox({ context });
  return unwrap({
    result: await execute({
      operation: completeIntegrationConnect,
      input: { provider: "FORTNOX", code: "code-1", state },
      context,
    }),
  });
}

const check = ({ context }: { context: ReturnType<typeof testContext> }) =>
  execute({ operation: checkIntegrationSetup, input: { provider: "FORTNOX" }, context });

describe("integration.checkSetup (ADR 0108)", () => {
  it("runs when a ledger connects and keeps what it found on the connection", async () => {
    const fortnox = installFakeFortnox();
    fortnox.setupIssues = [issue];
    const connected = await connect({ context: sessionAdmin() });
    expect(connected.setupCheckedAt).toBeInstanceOf(Date);
    expect(connected.setupIssues).toEqual([issue]);
  });

  it("reads the provider again and replaces the stored issues", async () => {
    const fortnox = installFakeFortnox();
    fortnox.setupIssues = [issue];
    const context = sessionAdmin();
    await connect({ context });
    fortnox.setupIssues = [];
    const checked = unwrap({ result: await check({ context }) });
    expect(checked.setupIssues).toEqual([]);
    const listed = unwrap({
      result: await execute({ operation: listIntegrations, input: {}, context }),
    });
    expect(listed.items.find((item) => item.provider === "FORTNOX")?.setupIssues).toEqual([]);
    expect(fortnox.portCalls.filter((entry) => entry === "checkSetup")).toHaveLength(2);
  });

  it("forgets what it found when the connection is disconnected", async () => {
    const fortnox = installFakeFortnox();
    fortnox.setupIssues = [issue];
    const context = sessionAdmin();
    await connect({ context });
    unwrap({
      result: await execute({
        operation: disconnectIntegration,
        input: { provider: "FORTNOX" },
        context,
      }),
    });
    fortnox.failing.add("checkSetup");
    const again = await connect({ context });
    expect(again.status).toBe("CONNECTED");
    expect(again.setupCheckedAt).toBeNull();
    expect(again.setupIssues).toEqual([]);
  });

  it("is a CONFLICT while the provider is not connected", async () => {
    installFakeFortnox();
    expect(errorCode({ result: await check({ context: testContext() }) })).toBe("CONFLICT");
  });

  it("keeps the connection when the provider cannot be read at connect", async () => {
    const fortnox = installFakeFortnox();
    fortnox.failing.add("checkSetup");
    const connected = await connect({ context: sessionAdmin() });
    expect(connected.status).toBe("CONNECTED");
    expect(connected.setupCheckedAt).toBeNull();
  });

  it("is FORBIDDEN for a manager and a member", async () => {
    installFakeFortnox();
    for (const access of ["write", "read"] as const) {
      expect(errorCode({ result: await check({ context: testContext({ access }) }) })).toBe(
        "FORBIDDEN",
      );
    }
  });
});
