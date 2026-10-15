import type { BookingDto, BookingUpdateInput, EntityTypeDto, VocabularyDto } from "@okazi/core";
import { BookingCreateInputSchema, buildFieldsSchema } from "@okazi/core/schemas";
import type { z } from "zod";
import { specsOf } from "@/components/typed-fields/field-specs";
import { fieldsPatch, fieldsToInput } from "@/components/typed-fields/raw-fields";
import { numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { fromLocalInputValue } from "../../occupancy/ui/local-date-time";
import type { BookingFormValues } from "./booking-form-values";

/** What the resolver outputs: core's create input (owners are set with `booking.assign`). */
export type BookingFormOutput = z.infer<typeof BookingCreateInputSchema>;

export type BookingSchemaInput = {
  type: EntityTypeDto | undefined;
  vocabularies: VocabularyDto[];
};

/** Core's booking schema with `fields` checked against the type; the server validates again. */
export function bookingFormSchema({ type, vocabularies }: BookingSchemaInput) {
  const specs = specsOf({ type, vocabularies });
  return formSchema({
    schema: BookingCreateInputSchema.extend({ fields: buildFieldsSchema({ specs }) }),
    toInput: ({ values }: { values: BookingFormValues }) => ({
      entityTypeId: values.entityTypeId,
      customerId: values.customerId,
      startsAt: fromLocalInputValue({ value: values.startsAt }),
      endsAt: fromLocalInputValue({ value: values.endsAt }),
      estimatedHeadcount: numberOrNull({ value: values.estimatedHeadcount }),
      guaranteedHeadcount: numberOrNull({ value: values.guaranteedHeadcount }),
      fields: fieldsToInput({ values, specs }),
    }),
  });
}

export type BookingUpdateArgs = {
  booking: BookingDto;
  values: BookingFormOutput;
  type: EntityTypeDto | undefined;
};

/** Create-shaped values → `booking.update` input; emptied fields are cleared with `null`. */
export function toBookingUpdate({ booking, values, type }: BookingUpdateArgs): BookingUpdateInput {
  const { entityTypeId: _type, salesOwnerId: _s, coordinatorId: _c, fields, ...rest } = values;
  return {
    id: booking.id,
    ...rest,
    fields: fieldsPatch({ type, stored: booking.fields, fields }),
  };
}
