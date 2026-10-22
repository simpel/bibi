import { getEnv } from "@bibi/config";
import { afterEach, beforeEach, vi } from "vitest";

export type Call = { url: string; method: string; headers: Record<string, string>; body?: string };

const saved = { ...getEnv() };
export const calls: Call[] = [];

/** Answers the next Stripe call with a canned status and body, and records what was sent. */
export function stubStripe({ status = 200, body }: { status?: number; body: unknown }) {
  calls.length = 0;
  vi.stubGlobal("fetch", async (url: string, init: RequestInit) => {
    calls.push({
      url,
      method: String(init.method),
      headers: init.headers as Record<string, string>,
      ...(init.body === undefined ? {} : { body: String(init.body) }),
    });
    return new Response(JSON.stringify(body), { status });
  });
}

export const accountWith = ({ status }: { status?: string }) => ({
  id: "acct_1",
  configuration: { merchant: { capabilities: { card_payments: status ? { status } : null } } },
});

/** Configures fake Stripe env for each test and restores it afterwards. */
export function useStripeEnv() {
  beforeEach(() => {
    Object.assign(getEnv(), {
      STRIPE_SECRET_KEY: "sk_test_x",
      STRIPE_PLATFORM_ACCOUNT_ID: "acct_bibi",
    });
  });
  afterEach(() => {
    Object.assign(getEnv(), saved);
    vi.unstubAllGlobals();
  });
}
