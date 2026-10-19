import type { AppErrorIssue } from "../../errors/app-error";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import type { TicketTemplateLineInput } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };
type Lines = { lines: readonly TicketTemplateLineInput[] };

type Known = { types: Set<string>; items: Set<string>; setups: Set<string> };

const unique = ({ ids }: { ids: readonly (string | null | undefined)[] }) => [
  ...new Set(ids.filter((id): id is string => Boolean(id))),
];

/** The ids of the lines' records that exist and fit; three batched reads. */
async function loadKnown({ context, lines }: Db & Lines): Promise<Known> {
  const typeIds = unique({ ids: lines.map((line) => line.entityTypeId) });
  const itemIds = unique({ ids: lines.map((line) => line.itemId) });
  const [types, items, setups] = await Promise.all([
    context.db.entityType.findMany({
      where: { id: { in: typeIds }, base: "LINE" },
      select: { id: true },
    }),
    context.db.item.findMany({
      where: { id: { in: itemIds }, customerId: null },
      select: { id: true },
    }),
    context.db.itemSetup.findMany({
      where: { itemId: { in: itemIds } },
      select: { itemId: true, setupId: true },
    }),
  ]);
  return {
    types: new Set(types.map((type) => type.id)),
    items: new Set(items.map((item) => item.id)),
    setups: new Set(setups.map((setup) => `${setup.itemId}:${setup.setupId}`)),
  };
}

type IssuesInput = Lines & { known: Known };

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
    if (!line.setupId) continue;
    const message = !line.itemId
      ? "A setup needs an item"
      : known.setups.has(`${line.itemId}:${line.setupId}`)
        ? null
        : "The item has no such setup";
    if (message) issues.push({ path: `${at}.setupId`, message });
  }
  return issues;
}

export type CheckTemplateLinesInput = Db & Lines;

/**
 * Every line of a template points at records that exist and fit: an active line type, a
 * general item (a customer's own package belongs to that customer, not to a template) and, when
 * given, one of that item's setups.
 */
export async function checkTemplateLines({
  context,
  lines,
}: CheckTemplateLinesInput): Promise<Result<true>> {
  const issues = lineIssues({ lines, known: await loadKnown({ context, lines }) });
  if (issues.length === 0) return ok({ value: true });
  return invalid({ message: "Invalid template lines", issues });
}
