import { getLogger } from "@bibi/logger";
import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { swishApiUrl } from "./swish-config";
import type { SwishCredentials } from "./swish-credentials";
import { type SwishHttpRequest, swishTransport } from "./swish-transport";

export type SwishResponse = {
  status: number;
  headers: Record<string, string>;
  json: unknown;
};

const parse = ({ body }: { body: string }): unknown => {
  if (!body) return null;
  try {
    return JSON.parse(body);
  } catch {
    return null;
  }
};

export type SwishCallInput = {
  credentials: SwishCredentials;
  method: SwishHttpRequest["method"];
  /** Path under the API root, e.g. `/api/v2/paymentrequests/<id>`. */
  path: string;
  body?: unknown;
  contentType?: string;
};

/**
 * One mTLS call to Swish with the venue's certificate. Returns the status, headers and body so
 * the caller can tell a refusal from an outage; a network or TLS failure is UNAVAILABLE. Never
 * logs the certificate, passphrase or body.
 */
export async function swishCall({
  credentials,
  method,
  path,
  body,
  contentType,
}: SwishCallInput): Promise<Result<SwishResponse>> {
  const url = `${swishApiUrl()}${path}`;
  try {
    const response = await swishTransport()({
      method,
      url,
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      ...(contentType ? { contentType } : {}),
      pfx: Buffer.from(credentials.certificate.replace(/\s+/g, ""), "base64"),
      passphrase: credentials.passphrase,
    });
    return ok({ value: { ...response, json: parse({ body: response.body }) } });
  } catch (cause) {
    getLogger().warn({
      event: "swish.unreachable",
      method,
      path: path.split("/").slice(0, 4).join("/"),
    });
    return err({
      error: new AppError({ code: "UNAVAILABLE", message: "Swish is unreachable.", cause }),
    });
  }
}

type SwishError = { errorCode?: unknown; errorMessage?: unknown };

/** Swish answered with an error status; the message carries Swish's error codes only. */
export function swishRefused({ what, response }: { what: string; response: SwishResponse }) {
  const list = Array.isArray(response.json) ? (response.json as SwishError[]) : [];
  const codes = list
    .map((e) => String(e.errorCode ?? ""))
    .filter(Boolean)
    .join(", ");
  const message = `Swish refused ${what} (${response.status}${codes ? `: ${codes}` : ""}).`;
  const code = response.status === 422 || response.status === 400 ? "VALIDATION" : "UNAVAILABLE";
  return err({ error: new AppError({ code, message }) });
}
