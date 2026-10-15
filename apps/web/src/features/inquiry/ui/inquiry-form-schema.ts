import type { EntityTypeDto, InquiryDto, InquiryUpdateInput, VocabularyDto } from "@okazi/core";
import { buildFieldsSchema, InquiryCreateInputSchema } from "@okazi/core/schemas";
import type { z } from "zod";
import { NONE } from "@/components/form/option-select-field";
import { specsOf } from "@/components/typed-fields/field-specs";
import { fieldsPatch, fieldsToInput } from "@/components/typed-fields/raw-fields";
import { numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { fromLocalInputValue } from "../../occupancy/ui/local-date-time";
import type { InquiryFormValues } from "./inquiry-form-values";

/** What the resolver outputs: core's create input (the owner is set with `inquiry.assign`). */
export type InquiryFormOutput = z.infer<typeof InquiryCreateInputSchema>;

export type InquirySchemaInput = {
  type: EntityTypeDto | undefined;
  vocabularies: VocabularyDto[];
};

const minor = ({ value }: { value: string }) => {
  const amount = numberOrNull({ value });
  return amount === null ? null : Math.round(amount * 100);
};

/** Core's inquiry schema with `fields` checked against the type; the server validates again. */
export function inquiryFormSchema({ type, vocabularies }: InquirySchemaInput) {
  const specs = specsOf({ type, vocabularies });
  return formSchema({
    schema: InquiryCreateInputSchema.extend({ fields: buildFieldsSchema({ specs }) }),
    toInput: ({ values }: { values: InquiryFormValues }) => ({
      entityTypeId: values.entityTypeId,
      customerId: values.customerId,
      contactId: values.contactId === NONE || values.contactId === "" ? null : values.contactId,
      desiredStartsAt: fromLocalInputValue({ value: values.desiredStartsAt }) ?? null,
      desiredEndsAt: fromLocalInputValue({ value: values.desiredEndsAt }) ?? null,
      quantity: numberOrNull({ value: values.quantity }),
      budgetMinor: minor({ value: values.budget }),
      fields: fieldsToInput({ values, specs }),
    }),
  });
}

export type InquiryUpdateArgs = {
  inquiry: InquiryDto;
  values: InquiryFormOutput;
  type: EntityTypeDto | undefined;
};

/** Create-shaped values → `inquiry.update` input; emptied fields are cleared with `null`. */
export function toInquiryUpdate({ inquiry, values, type }: InquiryUpdateArgs): InquiryUpdateInput {
  const { entityTypeId: _type, salesOwnerId: _owner, fields, ...rest } = values;
  return {
    id: inquiry.id,
    ...rest,
    fields: fieldsPatch({ type, stored: inquiry.fields, fields }),
  };
}
