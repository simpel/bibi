import { type Db, type ScopedDb, scopedDb } from "@okazi/db";
import type { OperationContext } from "./types";

/** What callers (adapters) hand to `execute`; `db` must be a full `ScopedDb`. */
export type ExecuteContext = Omit<OperationContext, "db" | "recordChange"> & { db: ScopedDb };

export type CreateExecuteContextInput = Omit<ExecuteContext, "db"> & {
  /** Base client; defaults to the process singleton from `@okazi/db`. */
  db?: Db;
};

/** Builds an execute context with a db pinned to `organizationId`. */
export function createExecuteContext({ db, ...rest }: CreateExecuteContextInput): ExecuteContext {
  return { ...rest, db: scopedDb({ organizationId: rest.organizationId, ...(db ? { db } : {}) }) };
}
