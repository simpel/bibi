import type { AppErrorIssue } from "../../errors/app-error";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import { type DefaultsGroup, lineDefaults } from "./line-defaults";
import type { OrderTemplateLineInput } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };
type Lines = { lines: readonly OrderTemplateLineInput[] };

type Known = {
  types: Set<string>;
  items: Set<string>;
  layouts: Set<string>;
  groups: Map<string, DefaultsGroup[]>;
};

const unique = ({ ids }: { ids: readonly (string | null | undefined)[] }) => [
  ...new Set(ids.filter((id): id is string => Boolean(id))),
];

/** The ids of the lines' records that exist and fit, and the items' groups; four batched reads. */
async function loadKnown({ context, lines }: Db & Lines): Promise<Known> {
  const typeIds = unique({ ids: lines.map((line) => line.entityTypeId) });
  const itemIds = unique({ ids: lines.map((line) => line.itemId) });
  const [types, items, layouts, groups] = await Promise.all([
    context.db.entityType.findMany({
      where: { id: { in: typeIds }, base: "LINE" },
      select: { id: true },
    }),
    context.db.item.findMany({
      where: { id: { in: itemIds }, customerId: null },
      select: { id: true },
    }),
    context.db.setupLayout.findMany({
      where: { itemId: { in: itemIds } },
      select: { id: true, itemId: true },
    }),
    context.db.itemCustomisationGroup.findMany({
      where: { itemId: { in: itemIds } },
      select: { itemId: true, maxPick: true, split: true, options: { select: { itemId: true } } },
    }),
  ]);
  const byItem = new Map<string, DefaultsGroup[]>();
  for (const { itemId, ...group } of groups)
    byItem.set(itemId, [...(byItem.get(itemId) ?? []), group]);
  return {
    types: new Set(types.map((type) => type.id)),
    items: new Set(items.map((item) => item.id)),
    layouts: new Set(layouts.map((layout) => `${layout.itemId}:${layout.id}`)),
    groups: byItem,
  };
}

type IssuesInput = Lines & { known: Known };

/**
 * One issue per line whose default choices do not fit its item (ADR 0089): each must be an
 * option of a non-split group, at most the group's maxPick, `lines.<n>.options`.
 */
function optionIssues({ lines, known }: IssuesInput): AppErrorIssue[] {
  return lines.flatMap((line, index) => {
    const itemIds = (line.options ?? []).map((option) => option.itemId);
    if (itemIds.length === 0) return [];
    const path = `lines.${index}.options`;
    if (!line.itemId) return [{ path, message: "Default choices need an item" }];
    if (new Set(itemIds).size !== itemIds.length) {
      return [{ path, message: "A default choice is given twice" }];
    }
    const groups = known.groups.get(line.itemId) ?? [];
    if (!lineDefaults({ itemIds, groups }).some((option) => option.stale)) return [];
    const message =
      "Default choices must be options of the item's groups, none in a split group, " +
      "at most each group's maximum";
    return [{ path, message }];
  });
}

/** One issue per bad reference, `lines.<n>.<field>`. */
function lineIssues({ lines, known }: IssuesInput): AppErrorIssue[] {
  const issues: AppErrorIssue[] = [];
  for (const [index, line] of lines.entries()) {
    const at = `lines.${index}`;
    if (!known.types.has(line.entityTypeId)) {
      issues.push({ path: `${at}.entityTypeId`, message: "Unknown line type" });
    }
    if (line.itemId && !known.items.has(line.itemId)) {
      issues.push({ path: `${at}.itemId`, message: "Unknown item" });
    }
    if (!line.layoutId) continue;
    const message = !line.itemId
      ? "A layout needs an item"
      : known.layouts.has(`${line.itemId}:${line.layoutId}`)
        ? null
        : "The item has no such layout";
    if (message) issues.push({ path: `${at}.layoutId`, message });
  }
  return issues;
}

export type CheckTemplateLinesInput = Db & Lines;

/**
 * Every line of a template points at records that exist and fit: an active line type, a
 * general item (a customer's own bundle belongs to that customer, not to a template), when
 * given one of that item's active layouts, and default choices that fit the item (ADR 0089).
 */
export async function checkTemplateLines({
  context,
  lines,
}: CheckTemplateLinesInput): Promise<Result<true>> {
  const known = await loadKnown({ context, lines });
  const issues = [...lineIssues({ lines, known }), ...optionIssues({ lines, known })];
  if (issues.length === 0) return ok({ value: true });
  return invalid({ message: "Invalid template lines", issues });
}
