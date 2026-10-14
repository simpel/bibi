import { type Db, getDb } from "@okazi/db";
import type { PlatformActor, PlatformContext } from "./types";

export type CreatePlatformContextInput = {
  actor: PlatformActor;
  /** Only `@okazi/auth` passes `"admin"`, after reading `user.role` from the database. */
  platformRole: "admin" | null;
  db?: Db;
};

export function createPlatformContext({
  actor,
  platformRole,
  db,
}: CreatePlatformContextInput): PlatformContext {
  return { actor, platformRole, db: db ?? getDb() };
}
