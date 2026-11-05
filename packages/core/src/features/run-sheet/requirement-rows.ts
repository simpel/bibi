import type { OperationContext } from "../../operations/types";
import type { RunSheetDefinitionDto } from "../run-sheet-definition/schema";
import type { RunSheetRow } from "./schema";

export type RequirementRowsInput = {
  context: Pick<OperationContext, "db">;
  orderId: string;
  definition: Pick<RunSheetDefinitionDto, "vocabularyIds">;
};

/**
 * One row per count on the order or its lines for the included lists. The key is
 * the level plus the value (one active count per both), so a count keeps its row across versions.
 * Counts only, never a person (ADR 0021).
 */
export async function requirementRows({
  context,
  orderId,
  definition,
}: RequirementRowsInput): Promise<RunSheetRow[]> {
  const rows = await context.db.requirement.findMany({
    where: { orderId, vocabularyValue: { vocabularyId: { in: definition.vocabularyIds } } },
    include: { vocabularyValue: { select: { name: true, vocabularyId: true } } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
  });
  const lists = await context.db.vocabulary.findMany({
    where: { id: { in: definition.vocabularyIds } },
    select: { id: true, name: true },
  });
  const names = new Map(lists.map((list) => [list.id, list.name]));
  return rows.map((row) => ({
    kind: "REQUIREMENT",
    key: `${row.lineId ?? "order"}:${row.vocabularyValueId}`,
    parentKey: row.lineId,
    label: row.vocabularyValue.name,
    itemName: null,
    quantity: row.quantity,
    startsAt: null,
    endsAt: null,
    values: { list: names.get(row.vocabularyValue.vocabularyId) ?? null },
  }));
}
