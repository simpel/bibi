import { z } from "zod";
import { ok, type Result } from "../../errors/result";
import type { ExternalCompany, OauthConnectPort } from "../connect-types";
import { oauthFormPost, oauthRefused, toOauthRefresh, toOauthTokens } from "../oauth/token-client";
import {
  VISMA_REFRESH_TTL_MS,
  VISMA_REFRESH_WINDOW_MS,
  VISMA_SCOPE,
  vismaClient,
  vismaIdentityUrl,
  vismaNotConfigured,
  vismaRedirectUri,
} from "./visma-config";
import { vismaCall, vismaRefused } from "./visma-request";

const NAME = "Visma";

const CompanySchema = z.object({
  Name: z.string(),
  CorporateIdentityNumber: z.string().nullish(),
});

/** Visma Connect's consent page: authorization code with PKCE S256 and offline access. */
function authorizeUrl({ state, codeChallenge }: { state: string; codeChallenge: string }) {
  const params = new URLSearchParams({
    client_id: vismaClient()?.clientId ?? "",
    redirect_uri: vismaRedirectUri(),
    scope: VISMA_SCOPE,
    state,
    response_type: "code",
    // The user picks which company to connect. // Verify against Visma sandbox
    prompt: "select_account",
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  return `${vismaIdentityUrl()}/connect/authorize?${params.toString()}`;
}

async function tokenCall({ form }: { form: Record<string, string> }) {
  const client = vismaClient();
  if (!client) return vismaNotConfigured();
  return oauthFormPost({ name: NAME, url: `${vismaIdentityUrl()}/connect/token`, client, form });
}

/** Visma Connect (OAuth 2, rotating refresh tokens) and the company lookup (ADR 0100). */
export const vismaOauth: OauthConnectPort = {
  kind: "OAUTH",
  refreshTtlMs: VISMA_REFRESH_TTL_MS,
  refreshWindowMs: VISMA_REFRESH_WINDOW_MS,
  authorizeUrl,
  redirectUri: vismaRedirectUri,
  async exchangeCode({ code, codeVerifier, redirectUri }) {
    const form = {
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    };
    const sent = await tokenCall({ form });
    if (!sent.ok) return sent;
    return toOauthTokens({ name: NAME, what: "the authorization code", response: sent.value });
  },
  async refresh({ refreshToken }) {
    const sent = await tokenCall({
      form: { grant_type: "refresh_token", refresh_token: refreshToken },
    });
    if (!sent.ok) return sent;
    return toOauthRefresh({ name: NAME, response: sent.value });
  },
  async revoke({ refreshToken }) {
    const client = vismaClient();
    if (!client) return vismaNotConfigured();
    const url = `${vismaIdentityUrl()}/connect/revocation`;
    const form = { token: refreshToken, token_type_hint: "refresh_token" };
    const sent = await oauthFormPost({ name: NAME, url, client, form });
    if (!sent.ok) return sent;
    if (sent.value.status !== 200)
      return oauthRefused({ name: NAME, what: "the revoke", response: sent.value });
    return ok({ value: { revoked: true } });
  },
  async describeCompany({ accessToken }): Promise<Result<ExternalCompany>> {
    const sent = await vismaCall({ path: "/companysettings", accessToken });
    if (!sent.ok) return sent;
    const parsed = CompanySchema.safeParse(sent.value.json);
    if (sent.value.status !== 200 || !parsed.success) {
      return vismaRefused({ what: "the company lookup", response: sent.value });
    }
    const { Name, CorporateIdentityNumber } = parsed.data;
    return ok({
      value: { name: Name, organizationNumber: CorporateIdentityNumber ?? null, tenantId: null },
    });
  },
};
