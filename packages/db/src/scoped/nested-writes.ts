import { Prisma } from "../generated/prisma/client";
import { ScopeViolationError } from "./scope-violation";

type Args = Record<string, unknown>;

/**
 * Relation operations a write may carry: they only link existing rows by key, the same as setting
 * a scalar foreign key. Every other nested operation (create, createMany, connectOrCreate, upsert,
 * update, updateMany, delete, deleteMany) would write a related row without the scope rules.
 */
const LINK_OPERATIONS = new Set<string>(["connect", "disconnect", "set"]);

type ScalarFieldsInput = { model: string };

/** The model's scalar (incl. Json) columns, from Prisma's generated `<Model>ScalarFieldEnum`. */
function scalarFields({ model }: ScalarFieldsInput): ReadonlySet<string> {
  const enums = Prisma as unknown as Record<string, Record<string, string> | undefined>;
  return new Set(Object.values(enums[`${model}ScalarFieldEnum`] ?? {}));
}

export type AssertNoNestedWritesInput = {
  model: string;
  operation: string;
  /** A write's `data` (object or array of rows), or an upsert's `create`/`update`. */
  data: unknown;
};

type RowInput = { model: string; operation: string; row: unknown; scalars: ReadonlySet<string> };

function assertRow({ model, operation, row, scalars }: RowInput): void {
  for (const [field, value] of Object.entries((row as Args | null | undefined) ?? {})) {
    if (scalars.has(field) || value === null || typeof value !== "object") continue;
    const nested = Object.keys(value).filter((key) => !LINK_OPERATIONS.has(key));
    if (nested.length > 0) {
      const reason = `nested relation write on ${field} (${nested.join(", ")})`;
      throw new ScopeViolationError({ model, operation, reason });
    }
  }
}

/**
 * Rejects nested relation writes: `applyScope` only stamps `organizationId`/`createdBy` and
 * applies the soft-delete and append-only rules on the top-level model, so a nested write would
 * slip past them. Fails closed; write related rows with their own call instead.
 */
export function assertNoNestedWrites({ model, operation, data }: AssertNoNestedWritesInput): void {
  const scalars = scalarFields({ model });
  const rows = Array.isArray(data) ? data : [data];
  for (const row of rows) {
    assertRow({ model, operation, row, scalars });
  }
}
