import { randomBytes } from "node:crypto";
import { setTimeout as sleep } from "node:timers/promises";
import { getEnv } from "@bibi/config";
import { afterEach, beforeEach } from "vitest";
import {
  connectIntegration,
  type ExecuteContext,
  execute,
  type FortnoxGateway,
  ok,
  setFortnoxGateway,
} from "../src/index";
import { testContext, unwrap } from "./helpers";

export type FakeFortnox = FortnoxGateway & {
  calls: string[];
  /** Next `refresh` answer: new tokens, or Fortnox refusing the refresh token. */
  refreshOutcome: "tokens" | "refused";
  issued: number;
};

const tokensNumbered = ({ n }: { n: number }) => ({
  accessToken: `access-${n}`,
  refreshToken: `refresh-${n}`,
  scope: "companyinformation",
  expiresIn: 3600,
});

/** An in-memory Fortnox that issues numbered tokens (`access-1`, `refresh-1`, ...). */
export function installFakeFortnox(): FakeFortnox {
  const issue = () => tokensNumbered({ n: ++fake.issued });
  const fake: FakeFortnox = {
    calls: [],
    refreshOutcome: "tokens",
    issued: 0,
    async exchangeCode({ code }) {
      fake.calls.push(`exchangeCode:${code}`);
      return ok({ value: issue() });
    },
    async refresh({ refreshToken }) {
      fake.calls.push(`refresh:${refreshToken}`);
      await sleep(20);
      // Fortnox rotates: only the latest refresh token is accepted.
      const spent = refreshToken !== `refresh-${fake.issued}`;
      if (fake.refreshOutcome === "refused" || spent) return ok({ value: { kind: "refused" } });
      return ok({ value: { kind: "tokens", tokens: issue() } });
    },
    async revoke({ refreshToken }) {
      fake.calls.push(`revoke:${refreshToken}`);
      return ok({ value: { revoked: true } });
    },
    async getCompany({ accessToken }) {
      fake.calls.push(`getCompany:${accessToken}`);
      return ok({
        value: {
          name: "Lindholmen Konferens AB",
          organizationNumber: "556000-0000",
          databaseNumber: "123",
        },
      });
    },
  };
  setFortnoxGateway({ gateway: fake });
  return fake;
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
    setFortnoxGateway({ gateway: undefined });
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
  const state = new URL(started.authorizeUrl).searchParams.get("state") ?? "";
  return { started, state };
}
