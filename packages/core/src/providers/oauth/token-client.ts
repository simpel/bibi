import { z } from "zod";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import type { OauthRefresh, OauthTokens } from "../connect-types";

export type OauthHttpResponse = { status: number; json: Record<string, unknown> };

export type OauthClient = { clientId: string; clientSecret: string };

export type OauthFormInput = {
  /** Provider name for messages, e.g. `Visma`. */
  name: string;
  url: string;
  client: OauthClient;
  form: Record<string, string>;
};

async function readJson({ response }: { response: Response }): Promise<Record<string, unknown>> {
  const text = await response.text();
  try {
    return text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

/**
 * One form POST to an OAuth 2 server with the app's Basic credentials (RFC 6749 §2.3.1). Returns
 * the status and body so the caller can tell a refused grant from an outage; never throws.
 */
export async function oauthFormPost({
  name,
  url,
  client,
  form,
}: OauthFormInput): Promise<Result<OauthHttpResponse>> {
  const basic = Buffer.from(
    `${encodeURIComponent(client.clientId)}:${encodeURIComponent(client.clientSecret)}`,
  ).toString("base64");
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Basic ${basic}`,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body: new URLSearchParams(form).toString(),
    });
    return ok({ value: { status: response.status, json: await readJson({ response }) } });
  } catch (cause) {
    const message = `${name} is unreachable.`;
    return err({ error: new AppError({ code: "UNAVAILABLE", message, cause }) });
  }
}

const TokenResponseSchema = z.object({
  access_token: z.string().min(1),
  refresh_token: z.string().min(1),
  scope: z.string().default(""),
  expires_in: z.coerce.number().int().positive(),
});

export type OauthRefusedInput = { name: string; what: string; response: OauthHttpResponse };

/** The server answered with an error; the message carries its error code, never a token. */
export function oauthRefused({ name, what, response }: OauthRefusedInput) {
  const detail = response.json.error_description ?? response.json.error ?? "";
  const message = `${name} refused ${what} (${response.status}${detail ? `: ${String(detail)}` : ""}).`;
  return err({ error: new AppError({ code: "UNAVAILABLE", message }) });
}

export type ToTokensInput = { name: string; what: string; response: OauthHttpResponse };

/** A 200 token response as tokens; anything else is a refusal. */
export function toOauthTokens({ name, what, response }: ToTokensInput): Result<OauthTokens> {
  const parsed = TokenResponseSchema.safeParse(response.json);
  if (response.status !== 200 || !parsed.success) return oauthRefused({ name, what, response });
  const { access_token, refresh_token, scope, expires_in } = parsed.data;
  return ok({
    value: { accessToken: access_token, refreshToken: refresh_token, scope, expiresIn: expires_in },
  });
}

/**
 * A refresh outcome: OAuth refuses a dead grant with 400 or 401 (`invalid_grant`), which makes the
 * connection EXPIRED; anything else that is not tokens is an outage that keeps the old token.
 */
export function toOauthRefresh({
  name,
  response,
}: Omit<ToTokensInput, "what">): Result<OauthRefresh> {
  if (response.status === 400 || response.status === 401) return ok({ value: { kind: "refused" } });
  const tokens = toOauthTokens({ name, what: "the refresh", response });
  if (!tokens.ok) return tokens;
  return ok({ value: { kind: "tokens", tokens: tokens.value } });
}
