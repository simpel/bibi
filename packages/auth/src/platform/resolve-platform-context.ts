import {
  createPlatformContext,
  ok,
  type PlatformContext,
  type Result,
  SUPERADMIN_ROLE,
} from "@bibi/core";
import { addToLogContext, getLogger } from "@bibi/logger";
import { getAuth } from "../get-auth";
import { forbidden, unauthenticated } from "../resolve/errors";
import { readCredential } from "../resolve/read-credential";
import { isPlatformAdmin } from "./is-platform-admin";

export type ResolvePlatformContextInput = { headers: Headers };

const deny = ({ reason, userId }: { reason: string; userId?: string }) => {
  getLogger().warn({ event: "auth.platformDenied", reason, userId });
  return forbidden({ message: "Superadmins only" });
};

/**
 * THE caller resolution for platform operations (ADR 0015). Browser session only: API keys and
 * OAuth tokens (and so the AI assistant) are refused, as are impersonated sessions. The role is
 * read live from `user.role`.
 */
export async function resolvePlatformContext({
  headers,
}: ResolvePlatformContextInput): Promise<Result<PlatformContext>> {
  if (readCredential({ headers }).kind !== "session") return deny({ reason: "notSession" });
  const session = await getAuth().api.getSession({ headers });
  if (!session) return unauthenticated({ message: "Sign in required" });
  const userId = session.user.id;
  const { impersonatedBy } = session.session as { impersonatedBy?: string | null };
  if (impersonatedBy) return deny({ reason: "impersonated", userId });
  if (!(await isPlatformAdmin({ userId }))) return deny({ reason: "notAdmin", userId });
  addToLogContext({ fields: { userId, actorType: "user" } });
  return ok({
    value: createPlatformContext({
      actor: { type: "user", userId },
      platformRole: SUPERADMIN_ROLE,
    }),
  });
}
