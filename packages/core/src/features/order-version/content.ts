import { createHash } from "node:crypto";
import type { OperationContext } from "../../operations/types";
import type { LineRecord } from "../line/schema";
import { LINE_INCLUDE, toLineRecord } from "../line/to-line-record";
import type { VersionLine } from "./schema";

/** An order's content (ADR 0116): its active lines and headcounts, and their hash. */
export type OrderContent = {
  lines: VersionLine[];
  estimatedHeadcount: number | null;
  guaranteedHeadcount: number | null;
  hash: string;
};

type Sortable = Pick<VersionLine, "lineId" | "parentLineId" | "startsAt">;

/** Parents before their sub-lines, each level by time (untimed last), then by id. */
export function sortVersionLines<T extends Sortable>({ lines }: { lines: readonly T[] }): T[] {
  const time = ({ line }: { line: T }) => line.startsAt?.getTime() ?? Number.MAX_SAFE_INTEGER;
  const sorted = [...lines].sort(
    (a, b) => time({ line: a }) - time({ line: b }) || a.lineId.localeCompare(b.lineId),
  );
  const top = sorted.filter((line) => line.parentLineId === null);
  const known = new Set(top.map((line) => line.lineId));
  const orphans = sorted.filter((line) => line.parentLineId && !known.has(line.parentLineId));
  return [
    ...top.flatMap((parent) => [
      parent,
      ...sorted.filter((line) => line.parentLineId === parent.lineId),
    ]),
    ...orphans,
  ];
}

/** Keys in a stable order, so equal content always gives the same JSON. */
function canonical({ value }: { value: unknown }): unknown {
  if (value instanceof Date) return value.toISOString();
  if (Array.isArray(value)) return value.map((item) => canonical({ value: item }));
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b));
    return Object.fromEntries(entries.map(([k, v]) => [k, canonical({ value: v })]));
  }
  return value;
}

type HashInput = Omit<OrderContent, "hash">;

/** SHA-256 of the content: equal hashes are equal content. */
export function hashContent({ lines, estimatedHeadcount, guaranteedHeadcount }: HashInput) {
  const sorted = [...lines].sort((a, b) => a.lineId.localeCompare(b.lineId));
  const json = JSON.stringify(
    canonical({ value: { lines: sorted, estimatedHeadcount, guaranteedHeadcount } }),
  );
  return createHash("sha256").update(json).digest("hex");
}

/** A line's content as a version holds it. */
export function toVersionLine({ line }: { line: LineRecord }): VersionLine {
  return {
    ...{ lineId: line.id, parentLineId: line.parentLineId, role: line.role },
    ...{ alternativeGroupId: line.alternativeGroupId, entityTypeId: line.entityTypeId },
    ...{ name: line.name, startsAt: line.startsAt, endsAt: line.endsAt },
    ...{ itemId: line.itemId, layoutId: line.layoutId },
    ...{ setupMinutes: line.setupMinutes, teardownMinutes: line.teardownMinutes },
    ...{ quantity: line.quantity, unitPriceMinor: line.unitPriceMinor },
    ...{ discountPercent: line.discountPercent, vatRatePercent: line.vatRatePercent },
    ...{ priceEffect: line.priceEffect, note: line.note, fields: line.fields },
  };
}

type LoadContentInput = { context: Pick<OperationContext, "db">; orderId: string };

/** The order's content now, or null when the order is missing or archived. */
export async function loadOrderContent({
  context,
  orderId,
}: LoadContentInput): Promise<OrderContent | null> {
  const order = await context.db.order.findFirst({
    where: { id: orderId },
    select: { estimatedHeadcount: true, guaranteedHeadcount: true },
  });
  if (!order) return null;
  const rows = await context.db.line.findMany({ where: { orderId }, include: LINE_INCLUDE });
  const lines = sortVersionLines({
    lines: rows.map((row) => toVersionLine({ line: toLineRecord({ row }) })),
  });
  const content = { lines, ...order };
  return { ...content, hash: hashContent(content) };
}
