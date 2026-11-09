import { setTimeout as sleep } from "node:timers/promises";
import { createId } from "@paralleldrive/cuid2";
import { ok } from "../../errors/result";
import type { HostedOnboardingPort, OauthConnectPort } from "../connect-types";
import type { MemoryState } from "./memory-state";

const tokensNumbered = ({ n }: { n: number }) => ({
  accessToken: `access-${n}`,
  refreshToken: `refresh-${n}`,
  scope: "companyinformation",
  expiresIn: 3600,
});

/** An OAuth server that issues numbered tokens and rotates refresh tokens like Fortnox. */
export function memoryOauth({ state }: { state: MemoryState }): OauthConnectPort {
  const issue = () => tokensNumbered({ n: ++state.issued });
  return {
    kind: "OAUTH",
    refreshTtlMs: 45 * 24 * 60 * 60 * 1000,
    refreshWindowMs: 14 * 24 * 60 * 60 * 1000,
    authorizeUrl: ({ state: oauthState, codeChallenge }) =>
      `https://oauth.provider.test/auth?${new URLSearchParams({ state: oauthState, code_challenge: codeChallenge })}`,
    redirectUri: () => "https://bibi.test/api/providers/callback",
    async exchangeCode({ code }) {
      state.calls.push(`exchangeCode:${code}`);
      return ok({ value: issue() });
    },
    async refresh({ refreshToken }) {
      state.calls.push(`refresh:${refreshToken}`);
      await sleep(20);
      // Only the latest refresh token is accepted.
      const spent = refreshToken !== `refresh-${state.issued}`;
      if (state.refreshOutcome === "refused" || spent) return ok({ value: { kind: "refused" } });
      return ok({ value: { kind: "tokens", tokens: issue() } });
    },
    async revoke({ refreshToken }) {
      state.calls.push(`revoke:${refreshToken}`);
      return ok({ value: { revoked: true } });
    },
    async describeCompany({ accessToken }) {
      state.calls.push(`getCompany:${accessToken}`);
      return ok({ value: state.company });
    },
  };
}

/** A hosted onboarding provider whose account reports `state.accountStatus`. */
export function memoryOnboarding({ state }: { state: MemoryState }): HostedOnboardingPort {
  return {
    kind: "HOSTED_ONBOARDING",
    async createAccount() {
      state.calls.push("createAccount");
      return ok({ value: { externalAccountId: `acct_${createId()}` } });
    },
    async status() {
      state.calls.push("getAccountStatus");
      const status = state.accountStatus === "ACTIVE" ? "CONNECTED" : state.accountStatus;
      return ok({ value: { status } });
    },
    async onboardingLink({ externalAccountId }) {
      state.calls.push("createOnboardingLink");
      return ok({
        value: {
          url: `https://connect.stripe.test/setup/${externalAccountId}`,
          expiresAt: new Date("2030-01-01T00:00:00.000Z"),
        },
      });
    },
  };
}
