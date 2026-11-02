import { z } from "zod";
import { ok, type Result } from "../../../errors/result";
import { FORTNOX_REVOKE_URL, FORTNOX_TOKEN_URL } from "./fortnox-config";
import {
  type FortnoxResponse,
  fortnoxFormPost,
  fortnoxGet,
  fortnoxRefused,
} from "./fortnox-request";
import type { FortnoxCompany, FortnoxGateway, FortnoxTokens } from "./gateway";

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

function toTokens({ response }: { response: FortnoxResponse }): Result<FortnoxTokens> {
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

/** The Fortnox OAuth server and REST API (ADR 0087). */
export const fortnoxGateway: FortnoxGateway = {
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
  async getCompany({ accessToken }): Promise<Result<FortnoxCompany>> {
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
        databaseNumber: company.DatabaseNumber == null ? null : String(company.DatabaseNumber),
      },
    });
  },
};
