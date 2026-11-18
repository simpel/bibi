import { type Db, type ScopedDb, SYSTEM_ACTOR_ID, scopedDb } from "@bibi/db";
import { grantAll, type PermissionSet } from "../permissions/permission-set";
import { ALL_RECORDS } from "../permissions/record-scope";
import type { OperationContext } from "./types";

/** What callers (adapters) hand to `execute`; `db` must be a full `ScopedDb`. */
export type ExecuteContext = Omit<OperationContext, "db" | "recordChange"> & { db: ScopedDb };

export type CreateExecuteContextInput = Omit<ExecuteContext, "db"> & {
  /** Base client; defaults to the process singleton from `@bibi/db`. */
  db?: Db;
};

/** Builds an execute context with a db pinned to `organizationId` that stamps the actor as author. */
export function createExecuteContext({ db, ...rest }: CreateExecuteContextInput): ExecuteContext {
  const { organizationId, actor } = rest;
  const actorId = actor.userId ?? actor.apiKeyId ?? SYSTEM_ACTOR_ID;
  return { ...rest, db: scopedDb({ organizationId, actorId, ...(db ? { db } : {}) }) };
}

export type CreateSystemContextInput = {
  organizationId: string;
  db?: Db;
  /** Narrows what the work may read (field gating); every permission when absent. */
  permissions?: PermissionSet;
};

/**
 * The SYSTEM context for internal work in one organization (jobs, provider events, the seed):
 * no rank, every record (ADR 0113), every permission unless narrowed. The one way to build it.
 */
export const createSystemContext = ({
  organizationId,
  db,
  permissions,
}: CreateSystemContextInput) =>
  createExecuteContext({
    organizationId,
    actor: { type: "system", userId: null },
    roles: [],
    permissions: permissions ?? grantAll({}),
    preset: null,
    scopes: ALL_RECORDS,
    ...(db ? { db } : {}),
  });
