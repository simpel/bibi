import { getEnv } from "@bibi/config";
import { getDb } from "@bibi/db";
import { createId } from "@paralleldrive/cuid2";
import { getAuth } from "../get-auth";

export type SignInByLinkInput = { email: string; name?: string };

export type SignedInByLink = { userId: string; headers: Headers };

/** Turns `set-cookie` response headers into request headers carrying the session cookie. */
function cookieHeaders({ response }: { response: Headers }): Headers {
  const cookie = response
    .getSetCookie()
    .map((value) => value.split(";")[0])
    .join("; ");
  return new Headers({ cookie });
}

/**
 * Tests only: signs in (and signs up a new email) through Better Auth's magic link verification,
 * the one web sign-in there is (ADR 0005). The pending link is written as the plugin stores it
 * (`magic-link:<token>`, plain token), so no mail is sent and parallel calls never share an outbox.
 */
export async function signInByLink({ email, name }: SignInByLinkInput): Promise<SignedInByLink> {
  // A session for any email without a mail: never outside a test run.
  if (getEnv().NODE_ENV !== "test") throw new Error("signInByLink runs only with NODE_ENV=test");
  const token = createId();
  await getDb().verification.create({
    data: {
      id: createId(),
      identifier: `magic-link:${token}`,
      value: JSON.stringify({ type: "magic-link", email, ...(name ? { name } : {}) }),
      expiresAt: new Date(Date.now() + 60_000),
    },
  });
  const { headers, response } = await getAuth().api.magicLinkVerify({
    query: { token },
    headers: new Headers(),
    returnHeaders: true,
  });
  return { userId: response.user.id, headers: cookieHeaders({ response: headers }) };
}
