import type { EntityType } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { EntityTypeDto } from "./schema";

type Db = Pick<OperationContext, "db">;

export type ToEntityTypeDtosInput = { context: Db; rows: readonly EntityType[] };

/** Attaches each type's active fields, in order. One query for all types. */
export async function toEntityTypeDtos({
  context,
  rows,
}: ToEntityTypeDtosInput): Promise<EntityTypeDto[]> {
  const fields = await context.db.fieldDefinition.findMany({
    where: { entityTypeId: { in: rows.map((row) => row.id) } },
    orderBy: [{ position: "asc" }, { id: "asc" }],
  });
  return rows.map((row) => ({
    ...row,
    fields: fields.filter((field) => field.entityTypeId === row.id),
  }));
}

export type ToEntityTypeDtoInput = { context: Db; row: EntityType };

export async function toEntityTypeDto({
  context,
  row,
}: ToEntityTypeDtoInput): Promise<EntityTypeDto> {
  const fields = await context.db.fieldDefinition.findMany({
    where: { entityTypeId: row.id },
    orderBy: [{ position: "asc" }, { id: "asc" }],
  });
  return { ...row, fields };
}
