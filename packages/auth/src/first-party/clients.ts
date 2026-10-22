import { getEnv } from "@bibi/config";

export type FirstPartyClientConfig = {
  /** OAuth client id (provisioned by ops); `undefined` = not configured. */
  clientId: () => string | undefined;
  /** Requested scope. `openid` only: no refresh token, tokens are re-minted when they expire. */
  scope: string;
  /**
   * Registered redirect URI path on `WEB_URL`. Never followed: the code is read server-side
   * from the authorize response, so no page has to exist there.
   */
  redirectPath: string;
  /**
   * Whether tokens issued to this client may carry `x-bibi-actor: ai`. Only the assistant: an
   * AI request makes commands proposals, so the flag must only be set for clients that run the
   * approval flow.
   */
  allowsAiActor: boolean;
  /** Shown when the client id is missing. */
  missingHint: string;
};

/**
 * Bibi's own OAuth clients for server-side token acquisition (`getFirstPartyAccessToken`).
 * Adding a client (⌘K, scheduled skills, integrations) = one entry here + provisioning.
 */
export const FIRST_PARTY_CLIENTS = {
  assistant: {
    clientId: () => getEnv().WEB_OAUTH_CLIENT_ID,
    scope: "openid",
    redirectPath: "/api/assistant/oauth/callback",
    allowsAiActor: true,
    missingHint:
      "WEB_OAUTH_CLIENT_ID is not set: run `pnpm --filter @bibi/web provision:oauth` and add it to .env",
  },
} as const satisfies Record<string, FirstPartyClientConfig>;

export type FirstPartyClient = keyof typeof FIRST_PARTY_CLIENTS;

export type ClientAllowsAiActorInput = { clientId: string };

/** True only for a configured registry client with `allowsAiActor`; unknown clients → false. */
export function clientAllowsAiActor({ clientId }: ClientAllowsAiActorInput): boolean {
  const entries: FirstPartyClientConfig[] = Object.values(FIRST_PARTY_CLIENTS);
  return entries.some((entry) => entry.allowsAiActor && entry.clientId() === clientId);
}
