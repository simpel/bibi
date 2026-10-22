import { type Db, getDb } from "@bibi/db";
import type { SUPERADMIN_ROLE } from "../permissions/fixed-roles";
import type { PlatformActor, PlatformContext } from "./types";

export type CreatePlatformContextInput = {
  actor: PlatformActor;
  /** Only `@bibi/auth` passes `"superadmin"`, after reading `user.role` from the database. */
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
