import { type Db, getDb } from "@okazi/db";
import type { SUPERADMIN_ROLE } from "../permissions/fixed-roles";
import type { PlatformActor, PlatformContext } from "./types";

export type CreatePlatformContextInput = {
  actor: PlatformActor;
  /** Only `@okazi/auth` passes `"superadmin"`, after reading `user.role` from the database. */
  platformRole: typeof SUPERADMIN_ROLE | null;
  db?: Db;
};

export function createPlatformContext({
  actor,
  platformRole,
  db,
}: CreatePlatformContextInput): PlatformContext {
  return { actor, platformRole, db: db ?? getDb() };
}
