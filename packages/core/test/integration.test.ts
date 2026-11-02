import { describe, expect, it, vi } from "vitest";
import {
  completeIntegrationConnect,
  connectIntegration,
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

const complete = ({
  context,
  state,
  code = "code-1",
}: {
  context: ReturnType<typeof sessionAdmin>;
  state: string;
  code?: string;
}) =>
  execute({
    operation: completeIntegrationConnect,
    input: { provider: "FORTNOX", code, state },
    context,
  });

describe("integration.connect", () => {
  it("lists Fortnox as NOT_CONNECTED and configured before anything starts", async () => {
    const list = unwrap({
      result: await execute({ operation: listIntegrations, input: {}, context: testContext() }),
    });
    expect(list.items).toEqual([
      expect.objectContaining({ provider: "FORTNOX", status: "NOT_CONNECTED", configured: true }),
    ]);
  });

  it("returns a service-account authorize URL with PKCE and stores only the state hash", async () => {
    installFakeFortnox();
    const { started, state } = await startFortnox({ context: testContext() });
    const params = new URL(started.authorizeUrl).searchParams;
    expect(started.authorizeUrl).toMatch(/^https:\/\/apps\.fortnox\.se\/oauth-v1\/auth\?/);
    expect(Object.fromEntries(params)).toMatchObject({
      client_id: "client-id",
      scope: "companyinformation invoice customer payment",
      access_type: "offline",
      response_type: "code",
      account_type: "service",
      code_challenge_method: "S256",
    });
    expect(params.get("redirect_uri")).toMatch(/\/api\/integrations\/fortnox\/callback$/);
    expect(state.length).toBeGreaterThanOrEqual(43);
    expect(started.status).toBe("PENDING");
  });

  it("is UNAVAILABLE when Fortnox is not configured", async () => {
    const { getEnv } = await import("@bibi/config");
    Object.assign(getEnv(), { FORTNOX_CLIENT_ID: undefined });
    const result = await execute({
      operation: connectIntegration,
      input: { provider: "FORTNOX" },
      context: testContext(),
    });
    expect(errorCode({ result })).toBe("UNAVAILABLE");
  });

  it("is FORBIDDEN for a manager and a member", async () => {
    for (const access of ["write", "read"] as const) {
      const result = await execute({
        operation: connectIntegration,
        input: { provider: "FORTNOX" },
        context: testContext({ access }),
      });
      expect(errorCode({ result })).toBe("FORBIDDEN");
    }
  });
});

describe("integration.completeConnect", () => {
  it("exchanges the code, stores the company and becomes CONNECTED", async () => {
    const fortnox = installFakeFortnox();
    const context = sessionAdmin();
    const { state } = await startFortnox({ context });
    const connected = unwrap({ result: await complete({ context, state }) });
    expect(connected).toMatchObject({
      status: "CONNECTED",
      companyName: "Lindholmen Konferens AB",
      organizationNumber: "556000-0000",
    });
    expect(fortnox.calls).toEqual(["exchangeCode:code-1", "getCompany:access-1"]);
    expect(JSON.stringify(connected)).not.toContain("access-1");
  });

  it("refuses a wrong state, a reused state and an expired one", async () => {
    installFakeFortnox();
    const context = sessionAdmin();
    const { state } = await startFortnox({ context });
    expect(errorCode({ result: await complete({ context, state: "wrong" }) })).toBe("VALIDATION");
    unwrap({ result: await complete({ context, state }) });
    expect(errorCode({ result: await complete({ context, state }) })).toBe("VALIDATION");
    const late = { ...context, now: () => new Date(Date.now() + 11 * 60 * 1000) };
    const again = await startFortnox({ context });
    expect(errorCode({ result: await complete({ context: late, state: again.state }) })).toBe(
      "VALIDATION",
    );
  });

  it("refuses another organization's state and a caller without a session", async () => {
    installFakeFortnox();
    const { state } = await startFortnox({ context: sessionAdmin() });
    expect(errorCode({ result: await complete({ context: sessionAdmin(), state }) })).toBe(
      "VALIDATION",
    );
    expect(errorCode({ result: await complete({ context: testContext(), state }) })).toBe(
      "FORBIDDEN",
    );
  });

  it("keeps the state cleared after Fortnox refuses the code", async () => {
    const fortnox = installFakeFortnox();
    const { AppError, err } = await import("../src/index");
    vi.spyOn(fortnox, "exchangeCode").mockResolvedValueOnce(
      err({ error: new AppError({ code: "UNAVAILABLE", message: "no" }) }),
    );
    const context = sessionAdmin();
    const { state } = await startFortnox({ context });
    expect(errorCode({ result: await complete({ context, state }) })).toBe("UNAVAILABLE");
    expect(errorCode({ result: await complete({ context, state }) })).toBe("VALIDATION");
  });
});
