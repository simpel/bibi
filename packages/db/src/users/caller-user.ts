import type { Db } from "../client";

export type CallerUserInput = { db: Pick<Db, "user">; actorId: string };

export type CallerUser = { name: string; email: string };

/**
 * The acting user's own Better Auth row (a global model the scoped client refuses). Pinned to
 * `actorId`, so it never reads another user; null for SYSTEM and API keys, which are not users.
 */
export async function readCallerUser({ db, actorId }: CallerUserInput): Promise<CallerUser | null> {
  return db.user.findUnique({ where: { id: actorId }, select: { name: true, email: true } });
}
