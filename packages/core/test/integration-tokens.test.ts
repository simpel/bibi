import { describe, expect, it } from "vitest";
import { openSecret, sealSecret } from "../src/crypto/secret-box";
import {
  completeIntegrationConnect,
  createExecuteContext,
  execute,
  getAccessToken,
  grantAll,
  listIntegrations,
  refreshExpiringIntegrations,
} from "../src/index";
import { errorCode, unwrap } from "./helpers";
import {
  installFakeFortnox,
  sessionAdmin,
  startFortnox,
  useFortnoxEnv,
} from "./integration-helpers";

useFortnoxEnv();

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

async function connected() {
  const fortnox = installFakeFortnox();
  const context = sessionAdmin();
  const { state } = await startFortnox({ context });
  const input = { provider: "FORTNOX" as const, code: "code-1", state };
  unwrap({ result: await execute({ operation: completeIntegrationConnect, input, context }) });
  return { fortnox, context };
}

const at = <T extends object>({ context, offsetMs }: { context: T; offsetMs: number }) => ({
  ...context,
  now: () => new Date(Date.now() + offsetMs),
});

describe("secret box", () => {
  it("round-trips and refuses a tampered value", () => {
    const sealed = unwrap({ result: sealSecret({ plain: "token" }) });
    expect(sealed).toMatch(/^v1\./);
    expect(unwrap({ result: openSecret({ sealed }) })).toBe("token");
    const tampered = `${sealed.slice(0, -2)}AA`;
    expect(errorCode({ result: openSecret({ sealed: tampered }) })).toBe("INTERNAL");
  });
});

describe("getAccessToken (Fortnox)", () => {
  it("returns the stored token while it is fresh", async () => {
    const { fortnox, context } = await connected();
    expect(unwrap({ result: await getAccessToken({ context, provider: "FORTNOX" }) })).toBe(
      "access-1",
    );
    expect(fortnox.calls.filter((call) => call.startsWith("refresh"))).toHaveLength(0);
  });

  it("refreshes near expiry and stores the rotated refresh token", async () => {
    const { fortnox, context } = await connected();
    const later = at({ context, offsetMs: HOUR });
    expect(unwrap({ result: await getAccessToken({ context: later, provider: "FORTNOX" }) })).toBe(
      "access-2",
    );
    expect(
      unwrap({
        result: await getAccessToken({
          context: at({ context, offsetMs: HOUR + 60_000 }),
          provider: "FORTNOX",
        }),
      }),
    ).toBe("access-2");
    expect(
      await getAccessToken({ context: at({ context, offsetMs: 2 * HOUR }), provider: "FORTNOX" }),
    ).toMatchObject({
      ok: true,
      value: "access-3",
    });
    expect(fortnox.calls).toContain("refresh:refresh-1");
    expect(fortnox.calls).toContain("refresh:refresh-2");
  });

  it("spends the refresh token once when two callers refresh at the same time", async () => {
    const { fortnox, context } = await connected();
    const later = at({ context, offsetMs: HOUR });
    const [a, b] = await Promise.all([
      getAccessToken({ context: later, provider: "FORTNOX" }),
      getAccessToken({ context: later, provider: "FORTNOX" }),
    ]);
    expect([a, b]).toEqual([
      { ok: true, value: "access-2" },
      { ok: true, value: "access-2" },
    ]);
    expect(fortnox.calls.filter((call) => call.startsWith("refresh:"))).toEqual([
      "refresh:refresh-1",
    ]);
  });

  it("marks the connection EXPIRED when Fortnox refuses the refresh token", async () => {
    const { fortnox, context } = await connected();
    fortnox.refreshOutcome = "refused";
    expect(
      errorCode({
        result: await getAccessToken({
          context: at({ context, offsetMs: HOUR }),
          provider: "FORTNOX",
        }),
      }),
    ).toBe("CONFLICT");
    const list = unwrap({
      result: await execute({ operation: listIntegrations, input: {}, context }),
    });
    expect(list.items.find((item) => item.provider === "FORTNOX")?.status).toBe("EXPIRED");
  });
});

describe("integration.refreshExpiring", () => {
  it("refreshes only connections near the 45-day limit, as SYSTEM", async () => {
    const { fortnox, context } = await connected();
    const system = createExecuteContext({
      organizationId: context.organizationId,
      roles: [],
      permissions: grantAll({}),
      actor: { type: "system", userId: null },
    });
    const early = unwrap({
      result: await execute({
        operation: refreshExpiringIntegrations,
        input: {},
        context: at({ context: system, offsetMs: DAY }),
      }),
    });
    expect(early).toMatchObject({ due: 0, refreshed: 0 });
    const late = unwrap({
      result: await execute({
        operation: refreshExpiringIntegrations,
        input: {},
        context: at({ context: system, offsetMs: 35 * DAY }),
      }),
    });
    expect(late).toMatchObject({ due: 1, refreshed: 1, expired: 0 });
    expect(fortnox.calls).toContain("refresh:refresh-1");
    const asUser = await execute({ operation: refreshExpiringIntegrations, input: {}, context });
    expect(errorCode({ result: asUser })).toBe("FORBIDDEN");
  });
});
