import type { RecordBase } from "../generated/prisma/client";

/**
 * How a record's `fields` must match (ADR 0056): `has` a value for the key, `lacks` one, or
 * `contains` one of `values` (a scalar or CHOICE value equal to it, or a MULTI_CHOICE array
 * including it).
 */
export type RecordFieldMatch =
  | { kind: "has"; key: string }
  | { kind: "lacks"; key: string }
  | { kind: "contains"; key: string; values: readonly string[] };

export type FindRecordsInput = {
  organizationId: string;
  entityTypeId: string;
  match: RecordFieldMatch;
  /** How many matching rows to return; `total` always counts them all. Defaults to 20. */
  limit?: number;
};

export type RecordRef = { id: string; base: RecordBase };

/** Active records of the type that match: their total and the first `limit` of them. */
export type RecordMatches = { total: number; rows: RecordRef[] };
