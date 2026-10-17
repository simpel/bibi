import type { BookingSeriesCreateInput, EntityTypeDto, VocabularyDto } from "@okazi/core";
import { BookingSeriesCreateInputSchema, buildFieldsSchema } from "@okazi/core/schemas";
import { DEFAULT_TIME_ZONE } from "@okazi/i18n";
import { NONE } from "@/components/form/option-select-field";
import { specsOf } from "@/components/typed-fields/field-specs";
import { fieldsToInput, type RawFieldValue, rawFields } from "@/components/typed-fields/raw-fields";
import { numberOrNull, numberOrUndefined } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { fromLocalInputValue } from "../../occupancy/ui/local-date-time";

/** Raw values of the series form: inputs are strings, the start a `datetime-local` value. */
export type SeriesFormValues = {
  entityTypeId: string;
  customerId: string;
  rule: string;
  startsAt: string;
  durationMinutes: string;
  itemId: string;
  setupId: string;
  estimatedHeadcount: string;
  fields: Record<string, RawFieldValue>;
};

export type SeriesFormOutput = BookingSeriesCreateInput;

export const seriesFormDefaults = ({ type }: { type: EntityTypeDto | undefined }) => ({
  entityTypeId: type?.id ?? "",
  customerId: "",
  rule: "FREQ=WEEKLY;COUNT=10",
  startsAt: "",
  durationMinutes: "60",
  itemId: NONE,
  setupId: NONE,
  estimatedHeadcount: "",
  fields: rawFields({ type, stored: {} }),
});

const picked = ({ value }: { value: string }) => (value === NONE || value === "" ? null : value);

export type SeriesSchemaInput = { type: EntityTypeDto | undefined; vocabularies: VocabularyDto[] };

/** Core's create schema with `fields` checked against the type; the server validates again. */
export function seriesFormSchema({ type, vocabularies }: SeriesSchemaInput) {
  const specs = specsOf({ type, vocabularies });
  return formSchema({
    schema: BookingSeriesCreateInputSchema.extend({ fields: buildFieldsSchema({ specs }) }),
    toInput: ({ values }: { values: SeriesFormValues }) => {
      const itemId = picked({ value: values.itemId });
      return {
        entityTypeId: values.entityTypeId,
        customerId: values.customerId,
        rule: values.rule,
        startsAt: fromLocalInputValue({ value: values.startsAt }),
        durationMinutes: numberOrUndefined({ value: values.durationMinutes }),
        timeZone: DEFAULT_TIME_ZONE,
        itemIds: itemId ? [itemId] : [],
        setupId: picked({ value: values.setupId }),
        estimatedHeadcount: numberOrNull({ value: values.estimatedHeadcount }),
        fields: fieldsToInput({ values, specs }),
      };
    },
  });
}
