import { randomBytes } from "node:crypto";
import { getEnv } from "@bibi/config";
import { afterEach, beforeEach } from "vitest";
import { connectWithCredentials, type ExecuteContext, resetProviderAdapters } from "../src/index";
import {
  type SwishHttpRequest,
  type SwishHttpResponse,
  setSwishTransport,
} from "../src/providers/swish/swish-transport";
import { unwrap } from "./helpers";

export const SWISH_NUMBER = "1231181189";

/** What an admin enters; the certificate is opaque to the stubbed transport. */
export const swishCredentials = ({ number = SWISH_NUMBER }: { number?: string } = {}) => ({
  swishNumber: number,
  certificate: Buffer.from("not a real p12 certificate").toString("base64"),
  passphrase: "swish",
});

export type SwishRoute = (request: SwishHttpRequest) => Partial<SwishHttpResponse> & {
  json?: unknown;
};

export type SwishStub = { calls: SwishHttpRequest[]; route: SwishRoute };

/**
 * Answers every Swish call through `stub.route` (default 404) and records it; a test changes
 * `route` to answer what it needs. No TLS or network is involved.
 */
export function stubSwish(): SwishStub {
  const stub: SwishStub = { calls: [], route: () => ({ status: 404 }) };
  setSwishTransport({
    transport: async (request) => {
      stub.calls.push(request);
      const { status = 200, headers = {}, json, body } = stub.route(request);
      return { status, headers, body: body ?? (json === undefined ? "" : JSON.stringify(json)) };
    },
  });
  return stub;
}

/** A sealing key and an https callback host per test; restores the env and transport after. */
export function useSwishEnv() {
  const saved = { ...getEnv() };
  beforeEach(() => {
    Object.assign(getEnv(), {
      INTEGRATION_SECRET_KEY: randomBytes(32).toString("base64"),
      WEB_URL: "https://bibi.test",
      SWISH_API_URL: "https://mss.swish.test/swish-cpcapi",
    });
  });
  afterEach(() => {
    Object.assign(getEnv(), saved);
    setSwishTransport({ transport: undefined });
    resetProviderAdapters();
  });
}

/** Connects Swish for the organization through the real adapter; Swish answers the probe 404. */
export async function connectSwish({
  context,
  stub,
}: {
  context: ExecuteContext;
  stub: SwishStub;
}) {
  const before = stub.route;
  stub.route = () => ({ status: 404 });
  const digits = String(randomBytes(4).readUInt32BE(0) % 10_000_000).padStart(7, "0");
  const credentials = swishCredentials({ number: `123${digits}` });
  const row = unwrap({
    result: await connectWithCredentials({ context, provider: "SWISH", credentials }),
  });
  stub.route = before;
  return row;
}

export type RequestState = {
  id: string;
  payeeAlias: string;
  status: string;
  amount?: string;
  payeePaymentReference?: string;
  paymentReference?: string;
};

/** A Swish payment request as GET returns it. */
export const paymentRequest = ({ status, ...rest }: RequestState) => ({
  callbackUrl: "https://bibi.test/api/providers/swish/webhook",
  currency: "SEK",
  message: "Order",
  payerAlias: "46712345678",
  datePaid: status === "PAID" ? "2026-11-09T10:00:00.000Z" : null,
  status,
  ...rest,
});
