import { randomBytes } from "node:crypto";
import { getEnv } from "@bibi/config";
import { afterEach, beforeEach } from "vitest";
import {
  connectIntegration,
  createMemoryProvider,
  type ExecuteContext,
  execute,
  findProvider,
  type MemoryProvider,
  resetProviderAdapters,
  setProviderAdapter,
} from "../src/index";
import { testContext, unwrap } from "./helpers";

export type FakeFortnox = MemoryProvider;

let last: FakeFortnox | null = null;

/** The fake `installFakeFortnox` installed last in this test, if any. */
export const lastFakeFortnox = (): FakeFortnox | null => last;

/**
 * An in-memory Fortnox (ADR 0100): OAuth that issues numbered tokens (`access-1`, `refresh-1`,
 * ...) and rotates them, and invoicing. `resetProviderAdapters` undoes it.
 */
export function installFakeFortnox(): FakeFortnox {
  const fake = createMemoryProvider({
    key: "FORTNOX",
    connectKind: "OAUTH",
    invoicing: true,
    ledger: true,
    // Like the real adapter, it books card and Swish payments taken in Bibi (ADR 0106).
    registerPayment: true,
  });
  fake.adapter.isConfigured = isConfigured;
  // Fortnox's own consent page and callback, so the authorize URL can be checked.
  const real = findProvider({ key: "FORTNOX" })?.connect;
  if (real?.kind === "OAUTH") {
    fake.oauth.authorizeUrl = real.authorizeUrl;
    fake.oauth.redirectUri = real.redirectUri;
  }
  setProviderAdapter({ key: "FORTNOX", adapter: fake.adapter });
  last = fake;
  return fake;
}

/** Configured like the real adapter: the app credentials and the sealing key. */
function isConfigured(): boolean {
  const { FORTNOX_CLIENT_ID, FORTNOX_CLIENT_SECRET, INTEGRATION_SECRET_KEY } = getEnv();
  return Boolean(FORTNOX_CLIENT_ID && FORTNOX_CLIENT_SECRET && INTEGRATION_SECRET_KEY);
}

const FORTNOX_KEYS = [
  "FORTNOX_CLIENT_ID",
  "FORTNOX_CLIENT_SECRET",
  "INTEGRATION_SECRET_KEY",
] as const;

/** Configures Fortnox credentials and a sealing key per test, and restores the env afterwards. */
export function useFortnoxEnv() {
  const saved = Object.fromEntries(FORTNOX_KEYS.map((key) => [key, getEnv()[key]]));
  beforeEach(() => {
    Object.assign(getEnv(), {
      FORTNOX_CLIENT_ID: "client-id",
      FORTNOX_CLIENT_SECRET: "client-secret",
      INTEGRATION_SECRET_KEY: randomBytes(32).toString("base64"),
    });
  });
  afterEach(() => {
    Object.assign(getEnv(), saved);
    resetProviderAdapters();
  });
}

/** An admin signed in through the browser, as the callback route runs it. */
export const sessionAdmin = (): ExecuteContext => ({ ...testContext(), credential: "session" });

export type StartInput = { context: ExecuteContext };

/** Runs `integration.connect` and returns the `state` from the authorize URL. */
export async function startFortnox({ context }: StartInput) {
  const started = unwrap({
    result: await execute({
      operation: connectIntegration,
      input: { provider: "FORTNOX" },
      context,
    }),
  });
  const state = new URL(started.authorizeUrl ?? "").searchParams.get("state") ?? "";
  return { started, state };
}
