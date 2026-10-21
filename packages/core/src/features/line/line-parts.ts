import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { archiveRecords } from "../../records/update-record";
import { invalid } from "../../shared/errors";
import { archiveRequirements } from "../requirement/archive-requirements";
import type { LinePeriod } from "./line-rules";
import type { LineRecord } from "./schema";
import { LINE_INCLUDE, toLineRecord } from "./to-line-record";

type Context = OperationContext;

export type PartsOfInput = { context: Pick<OperationContext, "db">; lineId: string };

/** The active part lines of a bundle line (ADR 0059), in creation order. */
export async function partsOf({ context, lineId }: PartsOfInput) {
  const rows = await context.db.line.findMany({
    where: { parentLineId: lineId },
    orderBy: [{ createdAt: "asc" }, { id: "asc" }],
    include: LINE_INCLUDE,
  });
  return rows.map((row) => toLineRecord({ row }));
}

export type CheckBundleItemInput = PartsOfInput & { before: LineRecord; itemId: string | null };

/** A bundle line with parts keeps its bundle item: its parts were expanded from it. */
export async function checkBundleItem({
  context,
  before,
  itemId,
}: CheckBundleItemInput): Promise<Result<true>> {
  if (itemId === before.itemId) return ok({ value: true });
  const parts = await context.db.line.count({ where: { parentLineId: before.id } });
  if (parts === 0) return ok({ value: true });
  const message =
    "A bundle line with part lines keeps its item; remove it and add the bundle again";
  return invalid({ message, issues: [{ path: "itemId", message }] });
}

export type MovePartsInput = { context: Context; before: LineRecord; after: LinePeriod };

/**
 * ADR 0059: moving a timed bundle line moves its timed part lines by the same delta, in the same
 * transaction; their holds follow by trigger (an overlap is CONFLICT).
 */
export async function moveParts({ context, before, after }: MovePartsInput) {
  if (!before.startsAt || !after.startsAt) return;
  const delta = after.startsAt.getTime() - before.startsAt.getTime();
  if (delta === 0) return;
  for (const part of await partsOf({ context, lineId: before.id })) {
    if (!part.startsAt || !part.endsAt) continue;
    const row = await context.db.line.update({
      where: { id: part.id },
      data: {
        startsAt: new Date(part.startsAt.getTime() + delta),
        endsAt: new Date(part.endsAt.getTime() + delta),
      },
      include: LINE_INCLUDE,
    });
    context.recordChange({ entityId: part.id, before: part, after: toLineRecord({ row }) });
  }
}

export type ArchiveLineRowInput = { context: Context; before: LineRecord };

/** Archives one line with its record and requirements, and records the change. */
export async function archiveLineRow({ context, before }: ArchiveLineRowInput) {
  const row = await context.db.line.update({
    where: { id: before.id },
    data: { status: "ARCHIVED" },
    include: LINE_INCLUDE,
  });
  await archiveRecords({ context, ids: [before.id] });
  await archiveRequirements({ context, lineId: before.id });
  const line = toLineRecord({ row });
  context.recordChange({ entityId: before.id, before, after: line });
  return line;
}

/** ADR 0059: removing a bundle line removes its part lines. */
export async function archiveParts({ context, before }: ArchiveLineRowInput) {
  for (const part of await partsOf({ context, lineId: before.id })) {
    await archiveLineRow({ context, before: part });
  }
}
