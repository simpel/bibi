import { API_KEY_PREFIX } from "../plugins/api-key";

/** What the caller presented. Precedence: API key > OAuth bearer token > session cookie. */
export type Credential =
  | { kind: "apiKey"; key: string }
  | { kind: "accessToken"; token: string }
  | { kind: "session" };

export type ReadCredentialInput = { headers: Headers };

export function readCredential({ headers }: ReadCredentialInput): Credential {
  const apiKey = headers.get("x-api-key")?.trim();
  if (apiKey) return { kind: "apiKey", key: apiKey };
  const match = /^Bearer\s+(\S+)$/i.exec(headers.get("authorization")?.trim() ?? "");
  const token = match?.[1];
  if (token?.startsWith(API_KEY_PREFIX)) return { kind: "apiKey", key: token };
  if (token) return { kind: "accessToken", token };
  return { kind: "session" };
}
