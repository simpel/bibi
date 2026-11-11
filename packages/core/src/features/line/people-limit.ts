import type { AppErrorIssue } from "../../errors/app-error";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { effectiveQuantity, type Headcount } from "./effective-values";
import { inheritsParentQuantity, type LineRole } from "./line-role";

type Db = { context: Pick<OperationContext, "db"> };

export type OverPeopleLimitInput = { quantity: number | null; maxPeople: number | null };

/** ADR 0103 decision 4: more people than the item's limit (null = no limit). */
export const overPeopleLimit = ({ quantity, maxPeople }: OverPeopleLimitInput): boolean =>
  maxPeople !== null && quantity !== null && quantity > maxPeople;

export type PeopleLimitMessageInput = {
  lineName: string;
  itemName: string;
  quantity: number;
  maxPeople: number;
};

/** The one wording of a broken people limit, naming the limit. */
export const peopleLimitMessage = ({
  lineName,
  itemName,
  quantity,
  maxPeople,
}: PeopleLimitMessageInput) =>
  `"${lineName}": ${quantity} people is above ${itemName}'s limit of ${maxPeople} people`;

/** A line as the limit sees it; `id` is null for a line not yet saved. */
export type PeopleLine = {
  id: string | null;
  name: string;
  itemId: string | null;
  quantity: number | null;
  parentLineId: string | null;
  role: LineRole | null;
};

export type CheckPeopleLimitInput = Db & {
  orderId: string;
  /** The line being saved, as it will be; replaces the stored line with its id. */
  line?: PeopleLine;
  /** The order's headcount after the change, and the field the issue goes to. */
  headcount?: { value: Headcount; path: string };
};

const LINE_SELECT = {
  ...{ id: true, name: true, itemId: true },
  ...{ quantity: true, parentLineId: true, role: true },
} as const;

async function loadSources({ context, orderId, line }: CheckPeopleLimitInput) {
  const [order, rows] = await Promise.all([
    context.db.order.findFirst({
      where: { id: orderId },
      select: { estimatedHeadcount: true, guaranteedHeadcount: true },
    }),
    context.db.line.findMany({ where: { orderId }, select: LINE_SELECT }),
  ]);
  const lines = [...rows.filter((row) => row.id !== line?.id), ...(line ? [line] : [])];
  const itemIds = [...new Set(lines.flatMap((row) => (row.itemId ? [row.itemId] : [])))];
  const items = await context.db.item.findMany({
    where: {
      id: { in: itemIds },
      maxPeople: { not: null },
      status: { in: ["ACTIVE", "ARCHIVED"] },
    },
    select: { id: true, name: true, maxPeople: true },
  });
  return { order, lines, items: new Map(items.map((item) => [item.id, item])) };
}

type Row = { row: PeopleLine };

type Counting = {
  byId: ReadonlyMap<string, PeopleLine>;
  counted: Headcount;
  line: PeopleLine | undefined;
  headcount: CheckPeopleLimitInput["headcount"];
};

/** The line whose quantity an option or add-on without its own counts (ADR 0082, 0088). */
const parentOf = ({ row, byId }: Row & Pick<Counting, "byId">) =>
  row.parentLineId && inheritsParentQuantity(row) ? (byId.get(row.parentLineId) ?? null) : null;

const quantityOf = ({ row, byId, counted }: Row & Counting) =>
  effectiveQuantity({ quantity: row.quantity, order: counted, parent: parentOf({ row, byId }) });

/** Where a line's issue goes when the change touches it; null when the change leaves it alone. */
function touchedPath({ row, ...counting }: Row & Counting): string | null {
  const { line, headcount, byId } = counting;
  const parent = parentOf({ row, byId });
  if (line && (row === line || (line.id !== null && parent?.id === line.id))) return "quantity";
  const { source } = quantityOf({ row, ...counting });
  const fromHeadcount = source === "ESTIMATED_HEADCOUNT" || source === "GUARANTEED_HEADCOUNT";
  return headcount && fromHeadcount ? headcount.path : null;
}

/**
 * ADR 0103 decision 4, the hard people limit: the saved line (and the sub-lines that count its
 * quantity), or every line counting the order's changed headcount, may not have more people
 * than its item's `maxPeople`. Effective quantity as ADR 0052: own, else the parent's for an
 * option or add-on, else the headcount. `VALIDATION` at `quantity` or the headcount's path.
 */
export async function checkPeopleLimit({
  context,
  orderId,
  line,
  headcount,
}: CheckPeopleLimitInput): Promise<Result<true>> {
  const { order, lines, items } = await loadSources({ context, orderId, line });
  if (items.size === 0) return ok({ value: true });
  const counting: Counting = {
    byId: new Map(lines.flatMap((row) => (row.id ? [[row.id, row] as const] : []))),
    counted: headcount?.value ?? order ?? { estimatedHeadcount: null, guaranteedHeadcount: null },
    ...{ line, headcount },
  };
  const issues: AppErrorIssue[] = lines.flatMap((row) => {
    const item = row.itemId ? items.get(row.itemId) : undefined;
    const path = item ? touchedPath({ row, ...counting }) : null;
    const quantity = quantityOf({ row, ...counting }).value;
    if (!item || item.maxPeople === null || !path || quantity === null) return [];
    if (!overPeopleLimit({ quantity, maxPeople: item.maxPeople })) return [];
    const message = peopleLimitMessage({
      ...{ lineName: row.name, itemName: item.name, quantity, maxPeople: item.maxPeople },
    });
    return [{ path, message }];
  });
  const [first] = issues;
  return first ? invalid({ message: first.message, issues }) : ok({ value: true });
}
