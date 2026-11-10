import { z } from "zod";
import { ok, type Result } from "../../errors/result";
import type { ExternalCompany, OauthConnectPort, OauthTokens } from "../connect-types";
import { fortnoxAuthorizeUrl } from "./authorize-url";
import {
  FORTNOX_REFRESH_TTL_MS,
  FORTNOX_REVOKE_URL,
  FORTNOX_TOKEN_URL,
  fortnoxCredentials,
  fortnoxRedirectUri,
} from "./fortnox-config";
import {
  type FortnoxResponse,
  fortnoxFormPost,
  fortnoxGet,
  fortnoxRefused,
} from "./fortnox-request";

const TokenResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  scope: z.string().default(""),
  expires_in: z.coerce.number().int().positive(),
});

const CompanyResponseSchema = z.object({
  CompanyInformation: z.object({
    CompanyName: z.string(),
    OrganizationNumber: z.string().nullish(),
    DatabaseNumber: z.union([z.string(), z.number()]).nullish(),
  }),
});

function toTokens({ response }: { response: FortnoxResponse }): Result<OauthTokens> {
  const parsed = TokenResponseSchema.safeParse(response.json);
  if (!parsed.success) return fortnoxRefused({ what: "the token", response });
  const { access_token, refresh_token, scope, expires_in } = parsed.data;
  return ok({
    value: { accessToken: access_token, refreshToken: refresh_token, scope, expiresIn: expires_in },
  });
}

/** OAuth 2 refuses a dead grant with 400 or 401 (`invalid_grant`); anything else is an outage. */
const isRefusedGrant = ({ response }: { response: FortnoxResponse }) =>
  response.status === 400 || response.status === 401;

/** Refresh connections whose refresh token has less than this left (45-day lifetime). */
const REFRESH_WINDOW_MS = 14 * 24 * 60 * 60 * 1000;

/** The Fortnox OAuth server and company lookup (ADR 0087). */
export const fortnoxOauth: OauthConnectPort = {
  kind: "OAUTH",
  refreshTtlMs: FORTNOX_REFRESH_TTL_MS,
  refreshWindowMs: REFRESH_WINDOW_MS,
  authorizeUrl: ({ state, codeChallenge }) =>
    fortnoxAuthorizeUrl({ clientId: fortnoxCredentials()?.clientId ?? "", state, codeChallenge }),
  redirectUri: fortnoxRedirectUri,
  async exchangeCode({ code, codeVerifier, redirectUri }) {
    const form = {
      grant_type: "authorization_code",
      code,
      redirect_uri: redirectUri,
      code_verifier: codeVerifier,
    };
    const sent = await fortnoxFormPost({ url: FORTNOX_TOKEN_URL, form });
    if (!sent.ok) return sent;
    if (sent.value.status !== 200) {
      return fortnoxRefused({ what: "the authorization code", response: sent.value });
    }
    return toTokens({ response: sent.value });
  },
  async refresh({ refreshToken }) {
    const form = { grant_type: "refresh_token", refresh_token: refreshToken };
    const sent = await fortnoxFormPost({ url: FORTNOX_TOKEN_URL, form });
    if (!sent.ok) return sent;
    if (isRefusedGrant({ response: sent.value })) return ok({ value: { kind: "refused" } });
    if (sent.value.status !== 200)
      return fortnoxRefused({ what: "the refresh", response: sent.value });
    const tokens = toTokens({ response: sent.value });
    if (!tokens.ok) return tokens;
    return ok({ value: { kind: "tokens", tokens: tokens.value } });
  },
  async revoke({ refreshToken }) {
    const form = { token_type_hint: "refresh_token", token: refreshToken };
    const sent = await fortnoxFormPost({ url: FORTNOX_REVOKE_URL, form });
    if (!sent.ok) return sent;
    if (sent.value.status !== 200)
      return fortnoxRefused({ what: "the revoke", response: sent.value });
    return ok({ value: { revoked: sent.value.json.revoked === true } });
  },
  async describeCompany({ accessToken }): Promise<Result<ExternalCompany>> {
    const sent = await fortnoxGet({ path: "/companyinformation", accessToken });
    if (!sent.ok) return sent;
    const parsed = CompanyResponseSchema.safeParse(sent.value.json);
    if (sent.value.status !== 200 || !parsed.success) {
      return fortnoxRefused({ what: "the company lookup", response: sent.value });
    }
    const company = parsed.data.CompanyInformation;
    return ok({
      value: {
        name: company.CompanyName,
        organizationNumber: company.OrganizationNumber ?? null,
        tenantId: company.DatabaseNumber == null ? null : String(company.DatabaseNumber),
      },
    });
  },
};
