import type { BookingSeriesUpdateOccurrencesInput, SeriesOccurrenceDto } from "@okazi/core";
import { BookingSeriesUpdateOccurrencesInputSchema } from "@okazi/core/schemas";
import { NONE } from "@/components/form/option-select-field";
import { numberOrUndefined } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { fromLocalInputValue, toLocalInputValue } from "../../occupancy/ui/local-date-time";

/** Raw values of the occurrence form; `patch` mirrors core's input so issues land on fields. */
export type OccurrenceFormValues = {
  scope: string;
  patch: { startsAt: string; durationMinutes: string; itemId: string; estimatedHeadcount: string };
};

export type OccurrenceFormOutput = BookingSeriesUpdateOccurrencesInput;

const minutesOf = ({ startsAt, endsAt }: SeriesOccurrenceDto) =>
  Math.round((endsAt.getTime() - startsAt.getTime()) / 60_000);

export const occurrenceFormDefaults = ({
  occurrence,
}: {
  occurrence: SeriesOccurrenceDto;
}): OccurrenceFormValues => ({
  scope: "THIS",
  patch: {
    startsAt: toLocalInputValue({ date: occurrence.startsAt }),
    durationMinutes: String(minutesOf(occurrence)),
    itemId: NONE,
    estimatedHeadcount: "",
  },
});

export type OccurrenceSchemaInput = { seriesId: string; occurrence: SeriesOccurrenceDto };

/** Core's `bookingSeries.updateOccurrences` schema; a blank or kept value is not sent. */
export const occurrenceFormSchema = ({ seriesId, occurrence }: OccurrenceSchemaInput) =>
  formSchema({
    schema: BookingSeriesUpdateOccurrencesInputSchema,
    toInput: ({ values: { scope, patch } }: { values: OccurrenceFormValues }) => {
      const headcount = numberOrUndefined({ value: patch.estimatedHeadcount });
      return {
        seriesId,
        fromIndex: occurrence.occurrenceIndex,
        scope,
        patch: {
          startsAt: fromLocalInputValue({ value: patch.startsAt }),
          durationMinutes: numberOrUndefined({ value: patch.durationMinutes }),
          ...(patch.itemId === NONE ? {} : { itemIds: [patch.itemId] }),
          ...(headcount === undefined ? {} : { estimatedHeadcount: headcount }),
        },
      };
    },
  });
