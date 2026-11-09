import { AppError } from "../../errors/app-error";
import { err, ok, type Result } from "../../errors/result";
import { vismaApiUrl } from "./visma-config";

export type VismaResponse = { status: number; json: unknown };

async function readJson({ response }: { response: Response }): Promise<unknown> {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  }
}

export type VismaCallInput = {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  /** Path under `/v2`, e.g. `/customers?$filter=...`. */
  path: string;
  accessToken: string;
  body?: unknown;
};

/** One call to the eAccounting API with an organization's access token; never throws. */
export async function vismaCall({
  method = "GET",
  path,
  accessToken,
  body,
}: VismaCallInput): Promise<Result<VismaResponse>> {
  try {
    const response = await fetch(`${vismaApiUrl()}${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json",
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    return ok({ value: { status: response.status, json: await readJson({ response }) } });
  } catch (cause) {
    return err({
      error: new AppError({ code: "UNAVAILABLE", message: "Visma is unreachable.", cause }),
    });
  }
}

/** Visma answered with an error status; the message carries its error text, never a token. */
export function vismaRefused({ what, response }: { what: string; response: VismaResponse }) {
  const json = (response.json ?? {}) as { Message?: unknown; DeveloperErrorMessage?: unknown };
  const detail = json.DeveloperErrorMessage ?? json.Message ?? "";
  const message = `Visma refused ${what} (${response.status}${detail ? `: ${String(detail)}` : ""}).`;
  return err({ error: new AppError({ code: "UNAVAILABLE", message }) });
}

/** An OData string literal: single quotes doubled. */
export const odataString = ({ value }: { value: string }) => `'${value.replace(/'/g, "''")}'`;
