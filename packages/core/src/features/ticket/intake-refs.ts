import type { AppErrorIssue } from "../../errors/app-error";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid } from "../../shared/errors";
import type { CreateDraftLine } from "./draft-line-schema";
import { checkDraftLines } from "./preview-draft-checks";

type Db = { context: Pick<OperationContext, "db"> };

type Lines = { lines: readonly CreateDraftLine[] };

/** The option items, requirement types and list values the lines name that exist: 3 queries. */
async function loadExtraRefs({ context, lines }: Db & Lines) {
  const options = lines.flatMap((line) => (line.options ?? []).map((option) => option.itemId));
  const needs = lines.flatMap((line) => line.requirements ?? []);
  const [items, types, values] = await Promise.all([
    context.db.item.findMany({ where: { id: { in: options } }, select: { id: true } }),
    context.db.entityType.findMany({
      where: { id: { in: needs.map((need) => need.entityTypeId) }, base: "REQUIREMENT" },
      select: { id: true },
    }),
    context.db.vocabularyValue.findMany({
      where: {
        id: { in: needs.map((need) => need.vocabularyValueId) },
        vocabulary: { status: "ACTIVE" },
      },
      select: { id: true },
    }),
  ]);
  const ids = ({ rows }: { rows: { id: string }[] }) => new Set(rows.map((row) => row.id));
  return {
    items: ids({ rows: items }),
    types: ids({ rows: types }),
    values: ids({ rows: values }),
  };
}

type Refs = Awaited<ReturnType<typeof loadExtraRefs>>;

type LineRefsInput = { line: CreateDraftLine; index: number; refs: Refs };

/** One line's unknown options and needs; never describes a record of another organization. */
function extraIssues({ line, index, refs }: LineRefsInput): AppErrorIssue[] {
  const at = `lines.${index}`;
  const options = (line.options ?? []).flatMap((option, o) =>
    refs.items.has(option.itemId)
      ? []
      : [{ path: `${at}.options.${o}.itemId`, message: "Item not found or not allowed" }],
  );
  const needs = (line.requirements ?? []).flatMap((need, r) => [
    ...(refs.types.has(need.entityTypeId)
      ? []
      : [{ path: `${at}.requirements.${r}.entityTypeId`, message: "Unknown requirement type" }]),
    ...(refs.values.has(need.vocabularyValueId)
      ? []
      : [{ path: `${at}.requirements.${r}.vocabularyValueId`, message: "Unknown list value" }]),
  ]);
  return [...options, ...needs];
}

export type CheckCreateLinesInput = Db & Lines & { customerId: string };

/**
 * Every id `ticket.create`'s lines reference is in the organization (ADR 0081): line types,
 * items (general or the customer's own), setups of the item, option items, requirement types and
 * list values. Problems are `VALIDATION` issues at `lines.<index>.<field>`, all at once.
 */
export async function checkCreateLines({
  context,
  lines,
  customerId,
}: CheckCreateLinesInput): Promise<Result<true>> {
  if (lines.length === 0) return ok({ value: true });
  const [drafts, refs] = await Promise.all([
    checkDraftLines({ context, lines, customerId }),
    loadExtraRefs({ context, lines }),
  ]);
  const issues = [
    ...(drafts.ok ? [] : drafts.error.issues),
    ...lines.flatMap((line, index) => extraIssues({ line, index, refs })),
  ];
  if (issues.length === 0) return ok({ value: true });
  return invalid({ message: `${issues.length} line issue(s)`, issues });
}
