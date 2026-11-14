import { afterEach, describe, expect, it, vi } from "vitest";
import { fortnoxInvoicing } from "../src/providers/fortnox/fortnox-invoicing";
import { errorCode, unwrap } from "./helpers";

const auth = { externalAccountId: null, accessToken: "access-1" };
const needs = { advancesAccount: "2420", revenueAccounts: ["3001", "3002"], vatRates: [25] };

type Answer = { status: number; json?: unknown };

/** Answers each `GET /accounts/<number>` from `byAccount`; other accounts are 404. */
function stubAccounts({ byAccount }: { byAccount: Record<string, Answer> }) {
  const asked: string[] = [];
  vi.stubGlobal("fetch", async (url: string) => {
    const account = String(url).split("/accounts/")[1] ?? "";
    asked.push(account);
    const { status, json } = byAccount[account] ?? { status: 404 };
    return new Response(json === undefined ? "" : JSON.stringify(json), { status });
  });
  return asked;
}

const check = () => {
  if (!fortnoxInvoicing.checkSetup) throw new Error("Fortnox has no setup check");
  return fortnoxInvoicing.checkSetup({ auth, needs });
};

const active = { status: 200, json: { Account: { Number: 1, Active: true } } };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Fortnox setup check (ADR 0108)", () => {
  it("finds nothing when every account Bibi books to is in the chart", async () => {
    const asked = stubAccounts({ byAccount: { "2420": active, "3001": active, "3002": active } });
    expect(unwrap({ result: await check() })).toEqual([]);
    expect(asked).toEqual(["2420", "3001", "3002"]);
  });

  it("names an account that is missing (404) or inactive", async () => {
    stubAccounts({
      byAccount: {
        "2420": { status: 404 },
        "3001": active,
        "3002": { status: 200, json: { Account: { Number: 3002, Active: false } } },
      },
    });
    expect(unwrap({ result: await check() })).toEqual([
      { code: "ACCOUNT_MISSING", account: "2420", vatPercent: null },
      { code: "ACCOUNT_MISSING", account: "3002", vatPercent: null },
    ]);
  });

  it("is UNAVAILABLE when Fortnox refuses the lookup, never read as a missing account", async () => {
    for (const status of [400, 403]) {
      stubAccounts({ byAccount: { "2420": { status } } });
      expect(errorCode({ result: await check() })).toBe("UNAVAILABLE");
    }
  });
});
