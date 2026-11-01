import type { OperationContext } from "../../operations/types";
import type { LineRecord } from "./schema";
import type { LineWarning } from "./warning-schema";

type Db = Pick<OperationContext, "db">;

export type OptionSplitInput = { context: Db; lines: readonly LineRecord[] };

/**
 * The parent line of each option line among the lines (ADR 0082), by option line id: an option
 * line without its own quantity has its parent's. Parents outside the lines are read in one query.
 */
export async function loadOptionParents({ context, lines }: OptionSplitInput) {
  const byId = new Map(lines.map((line) => [line.id, line]));
  const options = lines.filter((line) => line.priceEffect !== null && line.parentLineId !== null);
  const missing = [
    ...new Set(options.map((line) => line.parentLineId as string).filter((id) => !byId.has(id))),
  ];
  const loaded =
    missing.length === 0
      ? []
      : await context.db.line.findMany({
          where: { id: { in: missing }, status: { in: ["ACTIVE", "ARCHIVED"] } },
          select: { id: true, quantity: true },
        });
  const parents = new Map<string, { quantity: number | null }>([
    ...loaded.map((row) => [row.id, row] as const),
    ...[...byId.values()].map((line) => [line.id, line] as const),
  ]);
  const out = new Map<string, { quantity: number | null }>();
  for (const line of options) {
    const parent = parents.get(line.parentLineId as string);
    if (parent) out.set(line.id, { quantity: parent.quantity });
  }
  return out;
}

/** The sum of a split group's chosen option quantities on one line. */
export type SplitSum = { groupId: string; sum: number };

/**
 * For each line with options chosen in a split group of its item (ADR 0082): the sum of the
 * option lines' quantities per group, in group order. Two queries for any number of lines.
 */
export async function loadSplitSums({ context, lines }: OptionSplitInput) {
  const out = new Map<string, SplitSum[]>();
  const itemIds = [...new Set(lines.flatMap((line) => (line.itemId ? [line.itemId] : [])))];
  if (itemIds.length === 0) return out;
  const groups = await context.db.itemCustomisationGroup.findMany({
    where: { itemId: { in: itemIds }, split: true },
    orderBy: [{ position: "asc" }, { id: "asc" }],
    select: { id: true, itemId: true, options: { select: { itemId: true } } },
  });
  if (groups.length === 0) return out;
  const options = await context.db.line.findMany({
    where: { parentLineId: { in: lines.map((line) => line.id) }, priceEffect: { not: null } },
    select: { parentLineId: true, itemId: true, quantity: true },
  });
  for (const line of lines) {
    const own = options.filter((option) => option.parentLineId === line.id);
    const sums = groups
      .filter((group) => group.itemId === line.itemId)
      .flatMap((group) => {
        const ids = group.options.map((option) => option.itemId);
        const chosen = own.filter((option) => option.itemId && ids.includes(option.itemId));
        const sum = chosen.reduce((total, option) => total + (option.quantity ?? 0), 0);
        return chosen.length === 0 ? [] : [{ groupId: group.id, sum }];
      });
    if (sums.length > 0) out.set(line.id, sums);
  }
  return out;
}

export type SplitWarningsInput = { sums: readonly SplitSum[] | undefined; expected: number | null };

/** `OPTION_SPLIT_MISMATCH` for each split group whose sum is not the line's quantity. */
export const splitWarnings = ({ sums, expected }: SplitWarningsInput): LineWarning[] =>
  expected === null
    ? []
    : (sums ?? [])
        .filter(({ sum }) => sum !== expected)
        .map(({ groupId, sum }) => ({ id: groupId, kind: "OPTION_SPLIT_MISMATCH", sum, expected }));
