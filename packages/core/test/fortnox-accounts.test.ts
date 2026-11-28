import { afterEach, describe, expect, it, vi } from "vitest";
import { fortnoxInvoicing } from "../src/providers/fortnox/fortnox-invoicing";
import { errorCode, unwrap } from "./helpers";
import { useFortnoxEnv } from "./integration-helpers";

const auth = { externalAccountId: null, accessToken: "access-1" };

type Page = { status: number; json?: unknown };

/** Answers `GET /accounts?page=n` from `pages` (1-based); records what was asked. */
function stubPages({ pages }: { pages: Page[] }) {
  const asked: string[] = [];
  vi.stubGlobal("fetch", async (url: string) => {
    asked.push(String(url).split("/3")[1] ?? "");
    const page = Number(new URL(String(url)).searchParams.get("page") ?? 1);
    const { status, json } = pages[page - 1] ?? { status: 404 };
    return new Response(json === undefined ? "" : JSON.stringify(json), { status });
  });
  return asked;
}

const list = () => {
  if (!fortnoxInvoicing.listAccounts) throw new Error("Fortnox lists no accounts");
  return fortnoxInvoicing.listAccounts({ auth });
};

const account = ({ n, active = true }: { n: number; active?: boolean }) => ({
  Number: n,
  Description: `Account ${n}`,
  Active: active,
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("Fortnox accounts (ADR 0123)", () => {
  // The client builds its URLs from FORTNOX_API_BASE_URL; set it here, not from the local .env.
  useFortnoxEnv();

  it("reads every page of the chart", async () => {
    const asked = stubPages({
      pages: [
        {
          status: 200,
          json: { Accounts: [account({ n: 2420 })], MetaInformation: { "@TotalPages": 2 } },
        },
        {
          status: 200,
          json: {
            Accounts: [account({ n: 3001, active: false })],
            MetaInformation: { "@TotalPages": 2 },
          },
        },
      ],
    });
    expect(unwrap({ result: await list() })).toEqual([
      { account: "2420", name: "Account 2420", active: true, vatRates: [], accounts: [] },
      { account: "3001", name: "Account 3001", active: false, vatRates: [], accounts: [] },
    ]);
    expect(asked).toEqual(["/accounts?page=1&limit=500", "/accounts?page=2&limit=500"]);
  });

  it("is FORBIDDEN without the bookkeeping scope (the venue reconnects)", async () => {
    stubPages({ pages: [{ status: 403 }] });
    expect(errorCode({ result: await list() })).toBe("FORBIDDEN");
  });

  it("is UNAVAILABLE for any other refusal", async () => {
    stubPages({ pages: [{ status: 500 }] });
    expect(errorCode({ result: await list() })).toBe("UNAVAILABLE");
  });
});
