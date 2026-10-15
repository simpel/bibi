import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import {
  type BookingSeriesUpdateOccurrencesInput,
  BookingSeriesUpdateOccurrencesInputSchema,
} from "./occurrence-schema";
import { openOccurrences } from "./open-occurrences";
import { patchOccurrence } from "./patch-occurrence";
import { BookingSeriesSchema, type BookingSeriesTemplate } from "./schema";
import { checkSeriesItems } from "./series-rules";
import { updateSeriesTemplate } from "./series-template";
import { loadBookingSeries } from "./to-booking-series-dto";

type ApplyInput = BookingSeriesUpdateOccurrencesInput & { context: OperationContext };

async function applyChange({ context, seriesId, fromIndex, scope, patch }: ApplyInput) {
  const series = await context.db.bookingSeries.findFirst({ where: { id: seriesId } });
  if (!series) return notFound({ entity: "BookingSeries" });
  if (series.cancelledAt) return conflict({ message: "The series is cancelled" });
  const occurrenceIndex = scope === "THIS" ? fromIndex : { gte: fromIndex };
  const rows = await openOccurrences({ context, seriesId, where: { occurrenceIndex } });
  const anchor = rows[0];
  if (anchor?.occurrenceIndex !== fromIndex) {
    return conflict({ message: `Occurrence ${fromIndex} is missing, cancelled or completed` });
  }
  const template = series.template as BookingSeriesTemplate;
  const setupId = patch.setupId !== undefined ? patch.setupId : template.setupId;
  const items = await checkSeriesItems({ context, itemIds: patch.itemIds ?? [], setupId });
  if (!items.ok) return items;
  const offsetMs = patch.startsAt ? patch.startsAt.getTime() - anchor.startsAt.getTime() : 0;
  const shared = { context, patch, offsetMs, template, changeoverMinutes: items.value };
  for (const row of rows) {
    const patched = await patchOccurrence({ ...shared, row });
    if (!patched.ok) return patched;
    if (scope === "THIS" && patched.value.moved && patched.value.row.clash) {
      return conflict({ message: "The items are already taken at that time" });
    }
  }
  if (scope === "THIS") return ok({ value: true });
  return updateSeriesTemplate({ context, series, patch, offsetMs });
}

export const updateBookingSeriesOccurrences = defineOperation({
  name: "bookingSeries.updateOccurrences",
  kind: "command",
  description:
    "Change a recurring booking from one occurrence (ADR 0023): scope THIS changes only that " +
    "occurrence, e.g. moves a clashing one to another room (`itemIds`) or time (`startsAt`); " +
    "FOLLOWING changes it and every later one (a new `startsAt` moves them all by the same " +
    "offset) and the series template going forward. Cancelled and completed occurrences are " +
    "left alone. With THIS, items that are taken give CONFLICT; with FOLLOWING a taken " +
    "occurrence is flagged `clash` as on create.",
  input: BookingSeriesUpdateOccurrencesInputSchema,
  output: BookingSeriesSchema,
  permission: "booking:write",
  handler: async ({ input, context }) => {
    const before = await loadBookingSeries({ context, id: input.seriesId });
    const applied: Result<unknown> = await applyChange({ context, ...input });
    if (!applied.ok) return applied;
    const after = await loadBookingSeries({ context, id: input.seriesId });
    if (!after) return notFound({ entity: "BookingSeries" });
    context.recordChange({ entityId: after.id, before, after });
    return ok({ value: after });
  },
});
