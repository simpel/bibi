import type { AppErrorIssue } from "../../errors/app-error";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import type { PreviewDraftLine } from "./draft-line-schema";

type Db = { context: Pick<OperationContext, "db"> };

type Indexed = { line: PreviewDraftLine; index: number };

/** ADR 0052: timed (both times, the end after the start) or untimed (neither). */
function periodIssue({ line, index }: Indexed): AppErrorIssue | null {
  const { startsAt, endsAt } = line;
  if (!startsAt && !endsAt) return null;
  if (startsAt && endsAt && endsAt > startsAt) return null;
  const path = `lines.${index}.${startsAt ? "endsAt" : "startsAt"}`;
  return { path, message: "Give both a start and an end (the end after the start), or neither" };
}

type RefsInput = Db & { lines: readonly PreviewDraftLine[]; customerId: string };

/** The referenced line types, items and item setups that exist: three queries for every line. */
async function loadRefs({ context, lines, customerId }: RefsInput) {
  const ids = ({ of }: { of: (line: PreviewDraftLine) => string | null | undefined }) => [
    ...new Set(lines.flatMap((line) => (of(line) ? [of(line) as string] : []))),
  ];
  const itemIds = ids({ of: (line) => line.itemId });
  const [types, items, setups] = await Promise.all([
    context.db.entityType.findMany({
      where: { id: { in: ids({ of: (line) => line.entityTypeId }) }, base: "LINE" },
      select: { id: true },
    }),
    // An item of the organization: general, or the customer's own bundle (as `line.create`).
    context.db.item.findMany({
      where: { id: { in: itemIds }, OR: [{ customerId: null }, { customerId }] },
      select: { id: true },
    }),
    context.db.itemSetup.findMany({
      where: { itemId: { in: itemIds }, setupId: { in: ids({ of: (line) => line.setupId }) } },
      select: { itemId: true, setupId: true },
    }),
  ]);
  return {
    types: new Set(types.map((type) => type.id)),
    items: new Set(items.map((item) => item.id)),
    setups: new Set(setups.map((row) => `${row.itemId} ${row.setupId}`)),
  };
}

type Refs = Awaited<ReturnType<typeof loadRefs>>;

/** The issues of one line's references; never describes a record the caller may not use. */
function refIssues({ line, index, refs }: Indexed & { refs: Refs }): AppErrorIssue[] {
  const at = ({ field, message }: { field: string; message: string }) => ({
    path: `lines.${index}.${field}`,
    message,
  });
  const issues: AppErrorIssue[] = [];
  if (!refs.types.has(line.entityTypeId))
    issues.push(at({ field: "entityTypeId", message: "Unknown line type" }));
  if (line.itemId && !refs.items.has(line.itemId)) {
    issues.push(at({ field: "itemId", message: "Item not found or not allowed" }));
  }
  if (line.setupId && !(line.itemId && refs.setups.has(`${line.itemId} ${line.setupId}`))) {
    issues.push(at({ field: "setupId", message: "The item has no such setup" }));
  }
  return issues;
}

export type CheckDraftLinesInput = RefsInput;

/**
 * Draft lines are checked as `line.create` would check them, without a ticket: the period, a
 * line type of the organization, an item that is general or the customer's own, and a setup of
 * that item. Every problem is a `VALIDATION` issue at `lines.<index>.<field>`.
 */
export async function checkDraftLines({
  context,
  lines,
  customerId,
}: CheckDraftLinesInput): Promise<Result<true>> {
  const refs = await loadRefs({ context, lines, customerId });
  const issues = lines.flatMap((line, index) => {
    const period = periodIssue({ line, index });
    return [...(period ? [period] : []), ...refIssues({ line, index, refs })];
  });
  if (issues.length === 0) return ok({ value: true });
  return invalid({ message: `${issues.length} draft line issue(s)`, issues });
}
