import type { Booking } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import type { SheetDefinitionDto } from "../sheet-definition/schema";
import { itemRows } from "./item-rows";
import { requirementRows } from "./requirement-rows";
import type { SheetContent } from "./schema";

export type BuildSheetContentInput = {
  context: Pick<OperationContext, "db">;
  booking: Booking;
  definition: SheetDefinitionDto;
};

/**
 * The snapshot a sheet version holds: the booking, then what the definition includes (items of
 * its types with its fields, counts of its lists). Reads current data only; nothing is written.
 */
export async function buildSheetContent({
  context,
  booking,
  definition,
}: BuildSheetContentInput): Promise<SheetContent> {
  const [items, requirements] = await Promise.all([
    itemRows({ context, bookingId: booking.id, definition }),
    requirementRows({ context, bookingId: booking.id, definition }),
  ]);
  const head = {
    kind: "BOOKING",
    key: booking.id,
    parentKey: null,
    label: String(booking.reference),
    itemName: null,
    quantity: booking.guaranteedHeadcount ?? booking.estimatedHeadcount,
    startsAt: booking.startsAt.toISOString(),
    endsAt: booking.endsAt.toISOString(),
    values: {},
  } as const;
  return { rows: [head, ...items, ...requirements] };
}
