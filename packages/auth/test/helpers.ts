import { createId } from "@paralleldrive/cuid2";
import { getAuth } from "../src/index";

export const PASSWORD = "correct-horse-battery";

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

/** Signs up a fresh user (unique email) and returns session headers. */
export async function signUp(): Promise<TestUser> {
  const email = `user-${createId()}@example.test`;
  const { headers, response } = await getAuth().api.signUpEmail({
    body: { email, password: PASSWORD, name: "Test User" },
    returnHeaders: true,
  });
  return { userId: response.user.id, email, headers: cookieHeaders({ response: headers }) };
}

export type SignInInput = { email: string };

export async function signIn({ email }: SignInInput): Promise<Headers> {
  const { headers } = await getAuth().api.signInEmail({
    body: { email, password: PASSWORD },
    returnHeaders: true,
  });
  return cookieHeaders({ response: headers });
}

export type CreateOrgInput = { headers: Headers };

/** Creates an organization owned by the session user; it becomes the active organization. */
export async function createOrg({ headers }: CreateOrgInput): Promise<string> {
  const slug = `org-${createId()}`;
  const org = await getAuth().api.createOrganization({ headers, body: { name: slug, slug } });
  if (!org) throw new Error("organization not created");
  return org.id;
}

export type WithHeadersInput = { headers: Headers; extra: Record<string, string> };

export function withHeaders({ headers, extra }: WithHeadersInput): Headers {
  const merged = new Headers(headers);
  for (const [key, value] of Object.entries(extra)) merged.set(key, value);
  return merged;
}
