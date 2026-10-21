import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { invalid, notFound } from "../../shared/errors";
import type { LineChooseOptionsInput } from "./choose-options-schema";
import { insertLine } from "./insert-line";
import { archiveLineRow, archiveParts } from "./line-parts";
import { type ChoosableOption, checkChoice, loadOptionGroups } from "./option-groups";
import type { LineRecord } from "./schema";
import { LINE_INCLUDE, loadLine, toLineRecord } from "./to-line-record";

type Context = OperationContext;
export type ChooseOptionsInput = { context: Context; input: LineChooseOptionsInput };

/** The line, locked for this transaction so concurrent choices on it run one after the other. */
async function lockLine({ context, id }: { context: Context; id: string }) {
  const found = await context.db.line.updateMany({
    where: { id },
    data: { updatedAt: new Date() },
  });
  return found.count > 0 ? loadLine({ context, id }) : null;
}

/** The line's active option lines, in creation order. */
async function optionLinesOf({ context, lineId }: { context: Context; lineId: string }) {
  const rows = await context.db.line.findMany({
    where: { parentLineId: lineId, priceEffect: { not: null } },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: LINE_INCLUDE,
  });
  return rows.map((row) => toLineRecord({ row }));
}

type AddInput = { context: Context; line: LineRecord; option: ChoosableOption };

/** One option line under the line: same ticket, type, fields, time and quantity. */
const addOptionLine = ({ context, line, option }: AddInput) =>
  insertLine({
    context,
    input: {
      ...{ ticketId: line.ticketId, entityTypeId: line.entityTypeId, fields: line.fields },
      ...{ name: option.name, itemId: option.itemId, priceEffect: option.priceEffect },
      ...{ startsAt: line.startsAt, endsAt: line.endsAt, quantity: line.quantity },
      parentLineId: line.id,
    },
  });

/**
 * `line.chooseOptions` (ADR 0059): archives the option lines no longer chosen and adds the newly
 * chosen ones. Returns the line's option lines in group order.
 */
export async function chooseOptions({
  context,
  input,
}: ChooseOptionsInput): Promise<Result<LineRecord[]>> {
  const line = await lockLine({ context, id: input.lineId });
  if (!line) return notFound({ entity: "Line" });
  if (!line.itemId) {
    const message = "The line has no item, so it has no options";
    return invalid({ message, issues: [{ path: "lineId", message }] });
  }
  const groups = await loadOptionGroups({ context, itemId: line.itemId });
  const chosen = checkChoice({ groups, optionItemIds: input.optionItemIds });
  if (!chosen.ok) return chosen;
  const existing = await optionLinesOf({ context, lineId: line.id });
  for (const before of existing.filter((row) => !input.optionItemIds.includes(row.itemId ?? ""))) {
    await archiveParts({ context, before });
    await archiveLineRow({ context, before });
  }
  const lines: LineRecord[] = [];
  for (const option of chosen.value) {
    const kept = existing.find((row) => row.itemId === option.itemId);
    const added = kept ? ok({ value: kept }) : await addOptionLine({ context, line, option });
    if (!added.ok) return added;
    lines.push(added.value);
  }
  return ok({ value: lines });
}
