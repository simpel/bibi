import { ok, type Result } from "@okazi/core";
import { getAuth } from "./get-auth";
import { unauthenticated } from "./resolve/errors";

export type RequireSessionInput = { headers: Headers };

export type AuthSession = NonNullable<
  Awaited<ReturnType<ReturnType<typeof getAuth>["api"]["getSession"]>>
>;

/** Session for server components/actions: `requireSession({ headers: await headers() })`. */
export async function requireSession({
  headers,
}: RequireSessionInput): Promise<Result<AuthSession>> {
  const session = await getAuth().api.getSession({ headers });
  if (!session) return unauthenticated({ message: "Sign in required" });
  return ok({ value: session });
}
