import { createHash, randomBytes } from "node:crypto";

/** How long an authorization may take before its state is refused (Fortnox codes live 10 min). */
export const OAUTH_STATE_TTL_MS = 10 * 60 * 1000;

export type OauthStart = {
  /** Sent to the provider and returned on the callback; only its hash is stored. */
  state: string;
  stateHash: string;
  /** PKCE verifier (RFC 7636): 43 url-safe characters, kept sealed until the code exchange. */
  codeVerifier: string;
  codeChallenge: string;
};

const sha256 = ({ value }: { value: string }) =>
  createHash("sha256").update(value).digest("base64url");

export type HashStateInput = { state: string };

export const hashOauthState = ({ state }: HashStateInput) => sha256({ value: state });

/** A fresh state and PKCE pair for one authorization (ADR 0087). */
export function newOauthStart(): OauthStart {
  const state = randomBytes(32).toString("base64url");
  const codeVerifier = randomBytes(32).toString("base64url");
  return {
    state,
    stateHash: hashOauthState({ state }),
    codeVerifier,
    codeChallenge: sha256({ value: codeVerifier }),
  };
}
