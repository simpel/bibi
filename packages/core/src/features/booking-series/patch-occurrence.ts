import type { Booking } from "@okazi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { toJson } from "../../shared/to-json";
import { toBookingDto } from "../booking/to-booking-dto";
import { asFieldValues } from "../field-definition/field-usage";
import type { OccurrencePatch } from "./occurrence-schema";
import { patchFields } from "./patch-fields";
import { occupiedItemIds, replaceOccupancy } from "./replace-occupancy";
import type { BookingSeriesTemplate } from "./schema";

export type PatchOccurrenceInput = {
  context: OperationContext;
  row: Booking;
  patch: OccurrencePatch;
  /** How far the occurrence moves, in milliseconds (0 = keeps its time). */
  offsetMs: number;
  /** The series template: the items and setup when the patch does not name them. */
  template: BookingSeriesTemplate;
  changeoverMinutes: number;
};

export type MovesOccurrenceInput = { patch: OccurrencePatch; row: Booking; offsetMs: number };

/** Whether the patch changes where or when the occurrence takes place. */
export function movesOccurrence({ patch, row, offsetMs }: MovesOccurrenceInput): boolean {
  const minutes = (row.endsAt.getTime() - row.startsAt.getTime()) / 60_000;
  const resized = patch.durationMinutes !== undefined && patch.durationMinutes !== minutes;
  return offsetMs !== 0 || resized || patch.itemIds !== undefined || patch.setupId !== undefined;
}

type Placement = Pick<PatchOccurrenceInput, "context" | "row" | "patch" | "template">;

/** The items and setup the occurrence gets: the patch's, else what it occupies, else the template's. */
async function placement({ context, row, patch, template }: Placement) {
  const occupied = await occupiedItemIds({ context, bookingId: row.id });
  const itemIds = patch.itemIds ?? (occupied.length > 0 ? occupied : template.itemIds);
  const setupId = patch.setupId !== undefined ? patch.setupId : template.setupId;
  return { itemIds, setupId };
}

type Moved = { startsAt: Date; endsAt: Date; clash: boolean; moved: boolean };

/** The occurrence's new period and, when it moves, its items re-occupied (or flagged `clash`). */
async function moveOccurrence({
  context,
  row,
  patch,
  offsetMs,
  template,
  changeoverMinutes,
}: PatchOccurrenceInput): Promise<Result<Moved>> {
  const durationMs = patch.durationMinutes
    ? patch.durationMinutes * 60_000
    : row.endsAt.getTime() - row.startsAt.getTime();
  const startsAt = new Date(row.startsAt.getTime() + offsetMs);
  const endsAt = new Date(startsAt.getTime() + durationMs);
  const moved = movesOccurrence({ patch, row, offsetMs });
  if (!moved) return ok({ value: { startsAt, endsAt, clash: row.clash, moved } });
  const place = await placement({ context, row, patch, template });
  const replaced = await replaceOccupancy({
    ...{ context, bookingId: row.id, changeoverMinutes, startsAt, endsAt, ...place },
  });
  if (!replaced.ok) return replaced;
  return ok({ value: { startsAt, endsAt, clash: replaced.value, moved } });
}

/**
 * Applies a series change to one occurrence: moves it, re-occupies its items (flagging `clash`
 * when they are taken) and sets headcount and own fields. Audited per booking.
 */
export async function patchOccurrence({
  context,
  row,
  patch,
  ...rest
}: PatchOccurrenceInput): Promise<Result<{ row: Booking; moved: boolean }>> {
  const move = await moveOccurrence({ context, row, patch, ...rest });
  if (!move.ok) return move;
  const { moved, ...period } = move.value;
  const fields = await patchFields({
    ...{ context, entityTypeId: row.entityTypeId, patch: patch.fields },
    before: asFieldValues({ value: row.fields }),
  });
  if (!fields.ok) return fields;
  const headcount = patch.estimatedHeadcount;
  const updated = await context.db.booking.update({
    where: { id: row.id },
    data: {
      ...{ ...period, fields: toJson({ value: fields.value }) ?? {} },
      ...(headcount !== undefined ? { estimatedHeadcount: headcount } : {}),
    },
  });
  const before = toBookingDto({ row });
  const after = toBookingDto({ row: updated });
  context.recordChange({ entityType: "booking", entityId: row.id, before, after });
  return ok({ value: { row: updated, moved } });
}
