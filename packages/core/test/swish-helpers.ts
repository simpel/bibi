import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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

const certificates = new Map<string, string>();

/**
 * A self-signed .p12 issued to `issuedTo` (subject CN, as Swish issues them), base64, made once
 * per number with the openssl CLI. The stubbed transport never uses it for TLS.
 */
export function swishCertificate({ issuedTo }: { issuedTo: string }): string {
  const known = certificates.get(issuedTo);
  if (known) return known;
  const dir = mkdtempSync(join(tmpdir(), "swish-cert-"));
  const key = join(dir, "key.pem");
  const cert = join(dir, "cert.pem");
  const p12 = join(dir, "cert.p12");
  try {
    const subject = `/CN=${issuedTo}/O=Swish Test`;
    const ec = ["-newkey", "ec", "-pkeyopt", "ec_paramgen_curve:prime256v1", "-nodes"];
    const req = [
      "req",
      "-x509",
      ...ec,
      "-keyout",
      key,
      "-out",
      cert,
      "-days",
      "30",
      "-subj",
      subject,
    ];
    execFileSync("openssl", req, { stdio: "ignore" });
    const pkcs12 = ["pkcs12", "-export", "-inkey", key, "-in", cert, "-out", p12];
    execFileSync("openssl", [...pkcs12, "-passout", "pass:swish"], { stdio: "ignore" });
    const base64 = readFileSync(p12).toString("base64");
    certificates.set(issuedTo, base64);
    return base64;
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
}

/** What an admin enters: the number and a certificate issued to `issuedTo` (the number itself). */
export const swishCredentials = ({
  number = SWISH_NUMBER,
  issuedTo = number,
}: {
  number?: string;
  issuedTo?: string;
} = {}) => ({
  swishNumber: number,
  certificate: swishCertificate({ issuedTo }),
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
