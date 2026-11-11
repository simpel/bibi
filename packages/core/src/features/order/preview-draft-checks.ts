import type { AppErrorIssue } from "../../errors/app-error";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import type { DraftAddOn } from "./draft-add-on-schema";
import type { PreviewDraftLine } from "./draft-line-schema";

type Db = { context: Pick<OperationContext, "db"> };

/** What a line and an add-on share for the checks; an add-on's type and layout are optional. */
type Checked = Pick<PreviewDraftLine, "itemId" | "layoutId" | "startsAt" | "endsAt"> & {
  entityTypeId?: string;
  name?: string;
};

type AtInput = { entry: Checked; path: string };

/** ADR 0052: timed (both times, the end after the start) or untimed (neither). */
function periodIssue({ entry, path }: AtInput): AppErrorIssue | null {
  const { startsAt, endsAt } = entry;
  if (!startsAt && !endsAt) return null;
  if (startsAt && endsAt && endsAt > startsAt) return null;
  const at = `${path}.${startsAt ? "endsAt" : "startsAt"}`;
  return {
    path: at,
    message: "Give both a start and an end (the end after the start), or neither",
  };
}

/** Every line and add-on of the draft with the path its issues go to. */
const entriesOf = ({ lines }: { lines: readonly PreviewDraftLine[] }): AtInput[] =>
  lines.flatMap((line, index) => [
    { entry: line, path: `lines.${index}` },
    ...(line.addOns ?? []).map((addOn: DraftAddOn, at) => ({
      entry: addOn,
      path: `lines.${index}.addOns.${at}`,
    })),
  ]);

type RefsInput = Db & { lines: readonly PreviewDraftLine[]; customerId: string };

/** The referenced line types, items and item layouts that exist: three queries for every line. */
async function loadRefs({ context, lines, customerId }: RefsInput) {
  const entries = entriesOf({ lines }).map(({ entry }) => entry);
  const ids = ({ of }: { of: (entry: Checked) => string | null | undefined }) => [
    ...new Set(entries.flatMap((entry) => (of(entry) ? [of(entry) as string] : []))),
  ];
  const itemIds = ids({ of: (entry) => entry.itemId });
  const [types, items, layouts] = await Promise.all([
    context.db.entityType.findMany({
      where: { id: { in: ids({ of: (entry) => entry.entityTypeId }) }, base: "LINE" },
      select: { id: true },
    }),
    // An item of the organization: general, or the customer's own bundle (as `line.create`).
    context.db.item.findMany({
      where: { id: { in: itemIds }, OR: [{ customerId: null }, { customerId }] },
      select: { id: true },
    }),
    context.db.setupLayout.findMany({
      where: { itemId: { in: itemIds }, id: { in: ids({ of: (entry) => entry.layoutId }) } },
      select: { id: true, itemId: true },
    }),
  ]);
  return {
    types: new Set(types.map((type) => type.id)),
    items: new Set(items.map((item) => item.id)),
    layouts: new Set(layouts.map((row) => `${row.itemId} ${row.id}`)),
  };
}

type Refs = Awaited<ReturnType<typeof loadRefs>>;

/** The issues of one entry's references; never describes a record the caller may not use. */
function refIssues({ entry, path, refs }: AtInput & { refs: Refs }): AppErrorIssue[] {
  const at = ({ field, message }: { field: string; message: string }) => ({
    path: `${path}.${field}`,
    message,
  });
  const issues: AppErrorIssue[] = [];
  if (entry.entityTypeId !== undefined && !refs.types.has(entry.entityTypeId))
    issues.push(at({ field: "entityTypeId", message: "Unknown line type" }));
  if (entry.itemId && !refs.items.has(entry.itemId)) {
    issues.push(at({ field: "itemId", message: "Item not found or not allowed" }));
  }
  if (entry.layoutId && !(entry.itemId && refs.layouts.has(`${entry.itemId} ${entry.layoutId}`))) {
    issues.push(at({ field: "layoutId", message: "The item has no such layout" }));
  }
  if (!entry.name && !entry.itemId) {
    issues.push(at({ field: "name", message: "Give a name or an item" }));
  }
  return issues;
}

export type CheckDraftLinesInput = RefsInput;

/**
 * Draft lines and their add-ons (ADR 0088) are checked as `line.create` would check them,
 * without an order: the period, a line type of the organization, an item that is general or
 * the customer's own, an active layout of that item, and a name or an item. Every problem is a
 * `VALIDATION` issue at `lines.<index>.<field>` or `lines.<index>.addOns.<j>.<field>`.
 */
export async function checkDraftLines({
  context,
  lines,
  customerId,
}: CheckDraftLinesInput): Promise<Result<true>> {
  const refs = await loadRefs({ context, lines, customerId });
  const issues = entriesOf({ lines }).flatMap(({ entry, path }) => {
    const period = periodIssue({ entry, path });
    return [...(period ? [period] : []), ...refIssues({ entry, path, refs })];
  });
  if (issues.length === 0) return ok({ value: true });
  return invalid({ message: `${issues.length} draft line issue(s)`, issues });
}
