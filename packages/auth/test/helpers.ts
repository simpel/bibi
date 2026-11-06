import { FALLBACK_TIME_ZONE } from "@bibi/core/schemas";
import { createId } from "@paralleldrive/cuid2";
import { getAuth } from "../src/index";
import { signInByLink } from "../src/testing/sign-in-by-link";

export type TestUser = { userId: string; email: string; headers: Headers };

export type CookieHeadersInput = { response: Headers };

/** Turns `set-cookie` response headers into request headers carrying the session cookie. */
export function cookieHeaders({ response }: CookieHeadersInput): Headers {
  const cookie = response
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  return new Headers({ cookie });
}

/** Signs up a fresh user (unique email) by magic link and returns session headers. */
export async function signUp(): Promise<TestUser> {
  const email = `user-${createId()}@example.test`;
  const { userId, headers } = await signInByLink({ email, name: "Test User" });
  return { userId, email, headers };
}

export type SignInInput = { email: string };

/** A fresh session for an existing user, by magic link. */
export async function signIn({ email }: SignInInput): Promise<Headers> {
  return (await signInByLink({ email })).headers;
}

export type CreateOrgInput = { headers: Headers };

/** Creates an organization owned by the session user; it becomes the active organization. */
export async function createOrg({ headers }: CreateOrgInput): Promise<string> {
  const slug = `org-${createId()}`;
  const org = await getAuth().api.createOrganization({
    headers,
    body: { name: slug, slug, metadata: { timeZone: FALLBACK_TIME_ZONE } },
  });
  if (!org) throw new Error("organization not created");
  return org.id;
}

export type WithHeadersInput = { headers: Headers; extra: Record<string, string> };

export function withHeaders({ headers, extra }: WithHeadersInput): Headers {
  const merged = new Headers(headers);
  for (const [key, value] of Object.entries(extra)) merged.set(key, value);
  return merged;
}

export type CodeOfInput = { result: { ok: true } | { ok: false; error: { code: string } } };

/** "OK" or the AppError code – keeps assertions one-liners. */
export function codeOf({ result }: CodeOfInput): string {
  return result.ok ? "OK" : result.error.code;
}
