import type { CustomerDto, CustomerUpdateInput, EntityTypeDto, VocabularyDto } from "@okazi/core";
import { buildFieldsSchema, CustomerCreateInputSchema } from "@okazi/core/schemas";
import type { z } from "zod";
import { specsOf } from "@/components/typed-fields/field-specs";
import { fieldsPatch, fieldsToInput } from "@/components/typed-fields/raw-fields";
import { blankToNull, blankToUndefined, numberOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import type { CustomerFormValues } from "./customer-form-values";

/** What the resolver outputs: core's create input. */
export type CustomerFormOutput = z.infer<typeof CustomerCreateInputSchema>;

export type CustomerSchemaInput = {
  type: EntityTypeDto | undefined;
  vocabularies: VocabularyDto[];
};

/** Core's customer schema with `fields` checked against the type; the server validates again. */
export function customerFormSchema({ type, vocabularies }: CustomerSchemaInput) {
  const specs = specsOf({ type, vocabularies });
  return formSchema({
    schema: CustomerCreateInputSchema.extend({ fields: buildFieldsSchema({ specs }) }),
    toInput: ({ values }: { values: CustomerFormValues }) => {
      const kr = numberOrNull({ value: values.creditLimit });
      return {
        entityTypeId: values.entityTypeId,
        name: values.name.trim(),
        email: blankToNull({ value: values.email }),
        phone: blankToNull({ value: values.phone }),
        invoiceStreetAddress: blankToNull({ value: values.invoiceStreetAddress }),
        invoicePostalCode: blankToNull({ value: values.invoicePostalCode }),
        invoiceCity: blankToNull({ value: values.invoiceCity }),
        invoiceCountry: blankToUndefined({ value: values.invoiceCountry }),
        paymentTermsDays: numberOrNull({ value: values.paymentTermsDays }),
        creditLimitMinor: kr === null ? null : Math.round(kr * 100),
        fields: fieldsToInput({ values, specs }),
      };
    },
  });
}

export type CustomerUpdateArgs = {
  customer: CustomerDto;
  values: CustomerFormOutput;
  type: EntityTypeDto | undefined;
};

/** Create-shaped values → `customer.update` input; emptied fields are cleared with `null`. */
export function toCustomerUpdate({
  customer,
  values,
  type,
}: CustomerUpdateArgs): CustomerUpdateInput {
  const { entityTypeId: _type, fields, ...rest } = values;
  return {
    id: customer.id,
    ...rest,
    fields: fieldsPatch({ type, stored: customer.fields, fields }),
  };
}
