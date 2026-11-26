import { getDb } from "@bibi/db";
import { type ExecuteContext, execute } from "../src/index";
import type { AnyOperation } from "../src/operations/types";
import { unwrap } from "./helpers";

export type RunOnInput = { operation: AnyOperation; id: string; context: ExecuteContext };

/** Runs an `{ id }` operation (archive, restore, delete) and returns its result. */
export const runOn = ({ operation, id, context }: RunOnInput) =>
  execute({ operation, input: { id }, context });

/** Runs it and expects success. */
export const runOk = async ({ operation, id, context }: RunOnInput) =>
  unwrap({ result: await runOn({ operation, id, context }) });

const DAY_MS = 86_400_000;

export type BackdateInput = {
  table: "Task" | "Customer" | "Order" | "Item" | "Venue" | "Vocabulary";
  id: string;
  days: number;
};

/** Moves `archivedAt` back by `days`, as if archived that long ago (the retention clock). */
export async function backdate({ table, id, days }: BackdateInput): Promise<void> {
  const at = new Date(Date.now() - days * DAY_MS);
  await getDb().$executeRawUnsafe(`UPDATE "${table}" SET "archivedAt" = $1 WHERE id = $2`, at, id);
}

export type RowStatusInput = { table: BackdateInput["table"] | "Record"; id: string };

/** The raw row's status and `archivedAt`, or null when the row is gone. */
export async function rowOf({ table, id }: RowStatusInput) {
  const rows = await getDb().$queryRawUnsafe<{ status: string; archivedAt: Date | null }[]>(
    `SELECT status::text AS status, ${table === "Record" ? "NULL" : '"archivedAt"'} AS "archivedAt" FROM "${table}" WHERE id = $1`,
    id,
  );
  return rows[0] ?? null;
}
