import type { z } from "zod";
import type { OperationContext } from "../../operations/types";
import { freeTime } from "../calendar/free-time";
import type { DashboardSummaryInput, UtilisationSchema } from "./schema";
import { loadUtilisedItems, type UtilisedItem } from "./utilisation-inputs";

type Utilisation = z.infer<typeof UtilisationSchema>;
type Context = Pick<OperationContext, "db" | "permissions">;
const MINUTE = 60_000;

export type UtilisationInput = { context: Context; period: DashboardSummaryInput };

type Hold = { itemId: string; startsAt: Date; endsAt: Date };

/** Minutes open and booked per item type; a type's items add up. */
function rowsByType({ items, holds }: { items: UtilisedItem[]; holds: Hold[] }) {
  const byType = new Map<string, Utilisation>();
  for (const { id, typeId, typeName, open } of items) {
    const taken = holds
      .filter((hold) => hold.itemId === id)
      .map((hold) => ({ from: hold.startsAt.getTime(), to: hold.endsAt.getTime() }));
    const openMs = freeTime({ open, taken: [] });
    const row = byType.get(typeId) ?? {
      entityTypeId: typeId,
      name: typeName,
      items: 0,
      bookedMinutes: 0,
      openMinutes: 0,
      rate: null,
    };
    row.items += 1;
    row.openMinutes += Math.round(openMs / MINUTE);
    row.bookedMinutes += Math.round((openMs - freeTime({ open, taken })) / MINUTE);
    byType.set(typeId, row);
  }
  return byType;
}

/**
 * Per bookable item type: hold time inside the items' open hours over their open hours (ADR 0079).
 * Holds of one item are merged so an overlap counts once.
 */
export async function utilisation({ context, period }: UtilisationInput): Promise<Utilisation[]> {
  const items = await loadUtilisedItems({ context, period });
  const spans = items.flatMap((item) => item.open);
  const from = spans.reduce((min, span) => Math.min(min, span.from), Infinity);
  const to = spans.reduce((max, span) => Math.max(max, span.to), -Infinity);
  const holds =
    spans.length === 0
      ? []
      : await context.db.occupancy.findMany({
          where: {
            status: "ACTIVE",
            itemId: { in: items.map((item) => item.id) },
            startsAt: { lt: new Date(to) },
            endsAt: { gt: new Date(from) },
          },
          select: { itemId: true, startsAt: true, endsAt: true },
        });
  const byType = rowsByType({ items, holds });
  return [...byType.values()].map((row) => ({
    ...row,
    rate: row.openMinutes === 0 ? null : row.bookedMinutes / row.openMinutes,
  }));
}
