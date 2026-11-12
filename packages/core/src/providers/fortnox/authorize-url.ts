import { FORTNOX_SCOPE, fortnoxAuthUrl, fortnoxRedirectUri } from "./fortnox-config";

export type FortnoxAuthorizeUrlInput = { clientId: string; state: string; codeChallenge: string };

/**
 * Fortnox's consent page for a service account (`account_type=service`: only a Fortnox system
 * administrator can approve), offline access and PKCE S256 (ADR 0087).
 */
export function fortnoxAuthorizeUrl({
  clientId,
  state,
  codeChallenge,
}: FortnoxAuthorizeUrlInput): string {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: fortnoxRedirectUri(),
    scope: FORTNOX_SCOPE,
    state,
    access_type: "offline",
    response_type: "code",
    account_type: "service",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${fortnoxAuthUrl()}?${params.toString()}`;
}
