import { randomBytes } from "node:crypto";
import { getEnv } from "@bibi/config";
import { afterEach, beforeEach, vi } from "vitest";
import { resetProviderAdapters } from "../src/index";

export type VismaCall = {
  url: string;
  method: string;
  headers: Record<string, string>;
  body?: string;
};
export type VismaAnswer = { status?: number; json?: unknown };
export type VismaStub = { calls: VismaCall[]; route: (call: VismaCall) => VismaAnswer };

/** Answers every fetch through `stub.route` (default 404) and records it. */
export function stubVisma(): VismaStub {
  const stub: VismaStub = { calls: [], route: () => ({ status: 404 }) };
  vi.stubGlobal("fetch", async (url: string, init: RequestInit = {}) => {
    const call: VismaCall = {
      url: String(url),
      method: String(init.method ?? "GET"),
      headers: (init.headers ?? {}) as Record<string, string>,
      ...(init.body === undefined ? {} : { body: String(init.body) }),
    };
    stub.calls.push(call);
    const { status = 200, json } = stub.route(call);
    return new Response(json === undefined ? "" : JSON.stringify(json), { status });
  });
  return stub;
}

/** Visma app credentials, a sealing key and sandbox hosts per test; restored afterwards. */
export function useVismaEnv() {
  const saved = { ...getEnv() };
  beforeEach(() => {
    Object.assign(getEnv(), {
      VISMA_CLIENT_ID: "bibi-client",
      VISMA_CLIENT_SECRET: "bibi-secret",
      VISMA_IDENTITY_URL: "https://identity.visma.test",
      VISMA_API_URL: "https://api.visma.test",
      INTEGRATION_SECRET_KEY: randomBytes(32).toString("base64"),
      WEB_URL: "https://bibi.test",
    });
  });
  afterEach(() => {
    Object.assign(getEnv(), saved);
    vi.unstubAllGlobals();
    resetProviderAdapters();
  });
}

/** Path and query of a stubbed call under the API root, decoded. */
export const apiPath = ({ call }: { call: VismaCall }) =>
  decodeURIComponent(call.url.replace("https://api.visma.test/v2", ""));

export const tokenJson = ({ n }: { n: number }) => ({
  access_token: `visma-access-${n}`,
  refresh_token: `visma-refresh-${n}`,
  scope: "ea:api ea:sales offline_access",
  expires_in: 3600,
  token_type: "Bearer",
});

/**
 * A Visma company with no customers or articles yet: lookups answer empty, creates answer ids,
 * and `invoice` is what GET of an invoice returns.
 */
export function vismaCompany({ stub }: { stub: VismaStub }) {
  const state = { invoice: { TotalAmount: 0, RemainingAmount: 0 }, created: 0 };
  stub.route = (call) => {
    const path = apiPath({ call });
    if (call.url.startsWith("https://identity.visma.test")) return { json: tokenJson({ n: 1 }) };
    if (path === "/companysettings")
      return { json: { Name: "Venue AB", CorporateIdentityNumber: "556677-8899" } };
    if (path === "/termsofpayments") return { json: { Data: [{ Id: "t30", NumberOfDays: 30 }] } };
    if (path === "/units") return { json: { Data: [{ Id: "unit-st" }] } };
    if (path === "/articleaccountcodings") {
      const coding = ({ rate }: { rate: number }) => ({
        Id: `coding-${rate}`,
        VatRatePercent: rate / 100,
        IsActive: true,
      });
      return { json: { Data: [coding({ rate: 25 }), coding({ rate: 12 }), coding({ rate: 6 })] } };
    }
    if (call.method === "GET" && path.includes("$filter")) return { json: { Data: [] } };
    if (call.method === "POST") {
      state.created++;
      return { status: 201, json: { Id: `id-${state.created}` } };
    }
    if (call.method === "GET" && path.startsWith("/customerinvoices/")) {
      const id = path.split("/")[2];
      return {
        json: { Id: id, CustomerId: "id-1", CurrencyCode: "SEK", Rows: [], ...state.invoice },
      };
    }
    return { status: 404 };
  };
  return state;
}
