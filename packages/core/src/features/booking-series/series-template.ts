import type { BookingSeries } from "@okazi/db";
import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { toJson } from "../../shared/to-json";
import type { OccurrencePatch } from "./occurrence-schema";
import { patchFields } from "./patch-fields";
import type { BookingSeriesTemplate } from "./schema";

export type UpdateSeriesTemplateInput = {
  context: OperationContext;
  series: BookingSeries;
  patch: OccurrencePatch;
  offsetMs: number;
};

/**
 * "This and following" (ADR 0023) also changes the series going forward: its template, its
 * length and, by the same offset as the occurrences, the anchor the rule expands from.
 */
export async function updateSeriesTemplate({
  context,
  series,
  patch,
  offsetMs,
}: UpdateSeriesTemplateInput): Promise<Result<true>> {
  const template = series.template as BookingSeriesTemplate;
  const fields = await patchFields({
    ...{ context, entityTypeId: series.entityTypeId, patch: patch.fields },
    before: template.fields,
  });
  if (!fields.ok) return fields;
  const next: BookingSeriesTemplate = {
    ...template,
    itemIds: patch.itemIds ?? template.itemIds,
    setupId: patch.setupId !== undefined ? patch.setupId : template.setupId,
    estimatedHeadcount:
      patch.estimatedHeadcount !== undefined
        ? patch.estimatedHeadcount
        : template.estimatedHeadcount,
    fields: fields.value,
  };
  await context.db.bookingSeries.update({
    where: { id: series.id },
    data: {
      startsAt: new Date(series.startsAt.getTime() + offsetMs),
      durationMinutes: patch.durationMinutes ?? series.durationMinutes,
      template: toJson({ value: next }) ?? {},
    },
  });
  return ok({ value: true });
}
