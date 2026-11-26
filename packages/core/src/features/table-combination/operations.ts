import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { checkCombinations, layoutTables } from "./combination-rules";
import {
  type TableCombinationDto,
  type TableCombinationInput,
  TableCombinationListInputSchema,
  TableCombinationListOutputSchema,
  TableCombinationSaveInputSchema,
} from "./schema";

type Ctx = { context: Pick<OperationContext, "db"> };

/** The layout's active combinations with their tables, by name. */
export async function loadCombinations({
  context,
  layoutId,
}: Ctx & { layoutId: string }): Promise<TableCombinationDto[]> {
  const rows = await context.db.tableCombination.findMany({
    where: { layoutId },
    include: { members: { select: { elementId: true } } },
    orderBy: { name: "asc" },
  });
  return rows.map((row) => ({
    id: row.id,
    layoutId: row.layoutId,
    name: row.name,
    elementIds: row.members.map((member) => member.elementId),
    minCovers: row.minCovers,
    maxCovers: row.maxCovers,
    onlineBookable: row.onlineBookable,
  }));
}

export const listTableCombinations = defineOperation({
  name: "tableCombination.list",
  kind: "query",
  description:
    "A layout's table combinations (ADR 0119): tables booked together for one larger party, " +
    "also how a splittable table is drawn (its pieces plus their combination).",
  input: TableCombinationListInputSchema,
  output: TableCombinationListOutputSchema,
  permission: "diningSetup:read",
  handler: async ({ input, context }) => {
    const tables = await layoutTables({ context, layoutId: input.layoutId });
    if (!tables.ok) return tables;
    return ok({ value: { items: await loadCombinations({ context, layoutId: input.layoutId }) } });
  },
});

type WriteInput = Ctx & {
  context: Pick<OperationContext, "db" | "organizationId">;
  layoutId: string;
  combination: TableCombinationInput;
  keep: ReadonlySet<string>;
};

/** Updates a kept combination or creates a new one, and replaces its tables. */
async function writeCombination({ context, layoutId, combination, keep }: WriteInput) {
  const { id, elementIds, ...fields } = combination;
  const kept = id && keep.has(id);
  const saved = kept
    ? await context.db.tableCombination.update({ where: { id }, data: fields })
    : await context.db.tableCombination.create({
        data: { ...fields, layoutId, organizationId: context.organizationId },
      });
  await context.db.tableCombinationMember.deleteMany({ where: { combinationId: saved.id } });
  await context.db.tableCombinationMember.createMany({
    data: elementIds.map((elementId) => ({
      ...{ combinationId: saved.id, elementId, organizationId: context.organizationId },
    })),
  });
}

export const saveTableCombinations = defineOperation({
  name: "tableCombination.save",
  kind: "command",
  description:
    "Save a layout's table combinations as a whole, e.g. tables 7 + 8 as Long table for 6 to 8. " +
    "Each joins at least two tables (seated pieces) of the layout; one sent with its id keeps " +
    "it, the rest are new, and combinations left out are archived.",
  input: TableCombinationSaveInputSchema,
  output: TableCombinationListOutputSchema,
  permission: "diningSetup:write",
  handler: async ({ input, context }) => {
    const { layoutId, combinations } = input;
    const tables = await layoutTables({ context, layoutId });
    if (!tables.ok) return tables;
    const checked = checkCombinations({ tables: tables.value, combinations });
    if (!checked.ok) return checked;
    const before = await loadCombinations({ context, layoutId });
    const keep = new Set(before.map((row) => row.id));
    const sent = new Set(combinations.flatMap((row) => (row.id ? [row.id] : [])));
    const dropped = before.filter((row) => !sent.has(row.id)).map((row) => row.id);
    if (dropped.length > 0) {
      await context.db.tableCombination.updateMany({
        where: { id: { in: dropped } },
        data: { status: "ARCHIVED" },
      });
    }
    for (const combination of combinations)
      await writeCombination({ context, layoutId, combination, keep });
    const after = await loadCombinations({ context, layoutId });
    context.recordChange({
      entityId: layoutId,
      before: { items: before },
      after: { items: after },
    });
    return ok({ value: { items: after } });
  },
});

export const tableCombinationOperations = [listTableCombinations, saveTableCombinations];
