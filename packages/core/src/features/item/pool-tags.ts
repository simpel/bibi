import type { Prisma } from "@bibi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { isChoiceKind } from "../field-definition/field-kinds";

type Db = Pick<OperationContext, "db">;

export type PoolTagFilterInput = {
  context: Db;
  entityTypeId: string;
  tagValueIds: readonly string[];
};

const problem = ({ message }: { message: string }) =>
  invalid({ message, issues: [{ path: "tagValueIds", message }] });

type CarriesInput = { keys: readonly string[]; valueId: string };

/** The item's fields hold the value: a single choice equals it, a multi choice contains it. */
const carries = ({ keys, valueId }: CarriesInput): Prisma.ItemWhereInput => ({
  OR: keys.flatMap((key) => [
    { fields: { path: [key], equals: valueId } },
    { fields: { path: [key], array_contains: [valueId] } },
  ]),
});

/**
 * Where-clauses that keep the items carrying every required list value. A value must be an active
 * value of a list that one of the type's list fields uses; anything else could never match.
 */
export async function poolTagFilter({
  context,
  entityTypeId,
  tagValueIds,
}: PoolTagFilterInput): Promise<Result<Prisma.ItemWhereInput[]>> {
  const ids = [...new Set(tagValueIds)];
  if (!ids.length) return ok({ value: [] });
  const fields = await context.db.fieldDefinition.findMany({
    where: { entityTypeId, vocabularyId: { not: null }, status: "ACTIVE" },
    select: { key: true, kind: true, vocabularyId: true },
  });
  const listFields = fields.filter((field) => isChoiceKind({ kind: field.kind }));
  const values = await context.db.vocabularyValue.findMany({
    where: { id: { in: ids }, status: "ACTIVE" },
    select: { id: true, vocabularyId: true },
  });
  const filters: Prisma.ItemWhereInput[] = [];
  for (const id of ids) {
    const vocabularyId = values.find((value) => value.id === id)?.vocabularyId;
    const keys = listFields.filter((f) => f.vocabularyId === vocabularyId).map((f) => f.key);
    if (!vocabularyId || !keys.length) {
      return problem({ message: "Unknown list value, or one the item type has no list field for" });
    }
    filters.push(carries({ keys, valueId: id }));
  }
  return ok({ value: filters });
}
