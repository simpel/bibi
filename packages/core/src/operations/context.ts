import { type Db, type ScopedDb, SYSTEM_ACTOR_ID, scopedDb } from "@okazi/db";
import type { OperationContext } from "./types";

/** What callers (adapters) hand to `execute`; `db` must be a full `ScopedDb`. */
export type ExecuteContext = Omit<OperationContext, "db" | "recordChange"> & { db: ScopedDb };

export type CreateExecuteContextInput = Omit<ExecuteContext, "db"> & {
  /** Base client; defaults to the process singleton from `@okazi/db`. */
  db?: Db;
};

/** Builds an execute context with a db pinned to `organizationId` that stamps the actor as author. */
export function createExecuteContext({ db, ...rest }: CreateExecuteContextInput): ExecuteContext {
  const { organizationId, actor } = rest;
  const actorId = actor.userId ?? actor.apiKeyId ?? SYSTEM_ACTOR_ID;
  return { ...rest, db: scopedDb({ organizationId, actorId, ...(db ? { db } : {}) }) };
}
