import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { FORTNOX_API_URL, fortnoxCredentials, fortnoxNotConfigured } from "./fortnox-config";

export type FortnoxResponse = { status: number; json: Record<string, unknown> };

const unreachable = ({ cause }: { cause: unknown }) =>
  err({ error: new AppError({ code: "UNAVAILABLE", message: "Fortnox is unreachable.", cause }) });

async function readJson({ response }: { response: Response }): Promise<Record<string, unknown>> {
  const text = await response.text();
  if (!text) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export type FortnoxFormInput = { url: string; form: Record<string, string> };

/**
 * One call to Fortnox's OAuth server with the app's Basic credentials. Returns the status and body
 * so the caller can tell a refused grant (400) from an outage; never throws.
 */
export async function fortnoxFormPost({
  url,
  form,
}: FortnoxFormInput): Promise<Result<FortnoxResponse>> {
  const credentials = fortnoxCredentials();
  if (!credentials) return fortnoxNotConfigured();
  const basic = Buffer.from(`${credentials.clientId}:${credentials.clientSecret}`).toString(
    "base64",
  );
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
    return unreachable({ cause });
  }
}

export type FortnoxGetInput = { path: string; accessToken: string };

/** One GET against the Fortnox REST API with an organization's access token. */
export async function fortnoxGet({
  path,
  accessToken,
}: FortnoxGetInput): Promise<Result<FortnoxResponse>> {
  try {
    const response = await fetch(`${FORTNOX_API_URL}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}`, Accept: "application/json" },
    });
    return ok({ value: { status: response.status, json: await readJson({ response }) } });
  } catch (cause) {
    return unreachable({ cause });
  }
}

export type FortnoxSendInput = {
  method: "POST" | "PUT";
  path: string;
  accessToken: string;
  body?: Record<string, unknown>;
};

/** One JSON write against the Fortnox REST API with an organization's access token. */
export async function fortnoxSend({
  method,
  path,
  accessToken,
  body,
}: FortnoxSendInput): Promise<Result<FortnoxResponse>> {
  try {
    const response = await fetch(`${FORTNOX_API_URL}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    return ok({ value: { status: response.status, json: await readJson({ response }) } });
  } catch (cause) {
    return unreachable({ cause });
  }
}

export type RefusedInput = { what: string; response: FortnoxResponse };

/** Fortnox answered with an error status; the message carries its error text, never a token. */
export function fortnoxRefused({ what, response }: RefusedInput) {
  const info = response.json.ErrorInformation as { message?: unknown } | undefined;
  const detail =
    response.json.error_description ??
    response.json.error ??
    response.json.message ??
    info?.message ??
    "";
  const message = `Fortnox refused ${what} (${response.status}${detail ? `: ${String(detail)}` : ""}).`;
  return err({ error: new AppError({ code: "UNAVAILABLE", message }) });
}
