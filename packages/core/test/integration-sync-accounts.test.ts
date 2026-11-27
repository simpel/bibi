import { describe, expect, it } from "vitest";
import {
  completeIntegrationConnect,
  disconnectIntegration,
  execute,
  listAccountMappings,
  listIntegrationAccounts,
  listIntegrations,
  setAccountMapping,
  syncIntegrationAccounts,
} from "../src/index";
import { errorCode, testContext, unwrap } from "./helpers";
import {
  installFakeFortnox,
  sessionAdmin,
  startFortnox,
  useFortnoxEnv,
} from "./integration-helpers";

useFortnoxEnv();

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

const sync = ({ context }: { context: ReturnType<typeof testContext> }) =>
  execute({ operation: syncIntegrationAccounts, input: { provider: "FORTNOX" }, context });

const accounts = ({ context }: { context: ReturnType<typeof testContext> }) =>
  execute({ operation: listIntegrationAccounts, input: { provider: "FORTNOX" }, context });

describe("integration.syncAccounts (ADR 0123)", () => {
  it("reads the accounts when a ledger connects, stores them and maps the BAS defaults", async () => {
    installFakeFortnox();
    const context = sessionAdmin();
    const connected = await connect({ context });
    expect(connected.accountsSyncedAt).toBeInstanceOf(Date);
    const read = unwrap({ result: await accounts({ context }) });
    expect(read.readable).toBe(true);
    expect(read.accounts.map((a) => a.account)).toContain("3001");
    const mapped = unwrap({
      result: await execute({ operation: listAccountMappings, input: {}, context }),
    });
    expect(mapped.mappings).toEqual(
      expect.arrayContaining([
        { purpose: "ADVANCES", entityTypeId: null, providerAccount: "2420" },
        { purpose: "REVENUE_DEFAULT", entityTypeId: null, providerAccount: "3001" },
      ]),
    );
  });

  it("derives an issue when a mapped account is no longer in the chart", async () => {
    const fortnox = installFakeFortnox();
    const context = sessionAdmin();
    await connect({ context });
    unwrap({
      result: await execute({
        operation: setAccountMapping,
        input: { purpose: "REVENUE_DEFAULT", entityTypeId: null, providerAccount: "3010" },
        context,
      }),
    });
    fortnox.accounts = fortnox.accounts.filter((a) => a.account !== "3010");
    const synced = unwrap({ result: await sync({ context }) });
    expect(synced.setupIssues).toEqual([
      { code: "ACCOUNT_MISSING", account: "3010", vatPercent: null },
    ]);
    const listed = unwrap({
      result: await execute({ operation: listIntegrations, input: {}, context }),
    });
    expect(listed.items.find((item) => item.provider === "FORTNOX")?.setupIssues).toHaveLength(1);
  });

  it("stores an unreadable chart when the system refuses the list, so the page can say reconnect", async () => {
    const fortnox = installFakeFortnox();
    const context = sessionAdmin();
    await connect({ context });
    fortnox.adapter.invoicing = {
      ...(fortnox.adapter.invoicing as NonNullable<typeof fortnox.adapter.invoicing>),
      listAccounts: async () => ({
        ok: false,
        error: Object.assign(new Error("no scope"), { code: "FORBIDDEN" }) as never,
      }),
    };
    const synced = unwrap({ result: await sync({ context }) });
    expect(synced.setupIssues).toEqual([
      { code: "ACCOUNTS_UNAVAILABLE", account: null, vatPercent: null },
    ]);
    expect(unwrap({ result: await accounts({ context }) }).readable).toBe(false);
  });

  it("forgets the accounts when disconnected and keeps the connection when the read fails at connect", async () => {
    const fortnox = installFakeFortnox();
    const context = sessionAdmin();
    await connect({ context });
    unwrap({
      result: await execute({
        operation: disconnectIntegration,
        input: { provider: "FORTNOX" },
        context,
      }),
    });
    fortnox.failing.add("listAccounts");
    const again = await connect({ context });
    expect(again.status).toBe("CONNECTED");
    expect(again.accountsSyncedAt).toBeNull();
  });

  it("is a CONFLICT while not connected and needs integration:write", async () => {
    installFakeFortnox();
    expect(errorCode({ result: await sync({ context: testContext() }) })).toBe("CONFLICT");
    for (const access of ["write", "read"] as const) {
      expect(errorCode({ result: await sync({ context: testContext({ access }) }) })).toBe(
        "FORBIDDEN",
      );
    }
  });
});
