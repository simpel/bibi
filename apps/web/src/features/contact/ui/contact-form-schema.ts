import type { ContactDto, ContactUpdateInput, EntityTypeDto, VocabularyDto } from "@bibi/core";
import { buildFieldsSchema, ContactCreateInputSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import { specsOf } from "@/components/typed-fields/field-specs";
import {
  fieldsPatch,
  fieldsToInput,
  type RawFieldValue,
  rawFields,
} from "@/components/typed-fields/raw-fields";
import { blankToNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the contact form; the customer is fixed by the page. */
export type ContactFormValues = {
  entityTypeId: string;
  name: string;
  email: string;
  phone: string;
  fields: Record<string, RawFieldValue>;
};

export type ContactFormOutput = z.infer<typeof ContactCreateInputSchema>;

export type ContactDefaultsInput = { type: EntityTypeDto | undefined; contact?: ContactDto };

export const contactFormDefaults = ({
  type,
  contact,
}: ContactDefaultsInput): ContactFormValues => ({
  entityTypeId: type?.id ?? "",
  name: contact?.name ?? "",
  email: contact?.email ?? "",
  phone: contact?.phone ?? "",
  fields: rawFields({ type, stored: contact?.fields ?? {} }),
});

export type ContactSchemaInput = {
  customerId: string;
  type: EntityTypeDto | undefined;
  vocabularies: VocabularyDto[];
};

/** Core's contact schema with `fields` checked against the type; the server validates again. */
export function contactFormSchema({ customerId, type, vocabularies }: ContactSchemaInput) {
  const specs = specsOf({ type, vocabularies });
  return formSchema({
    schema: ContactCreateInputSchema.extend({ fields: buildFieldsSchema({ specs }) }),
    toInput: ({ values }: { values: ContactFormValues }) => ({
      customerId,
      entityTypeId: values.entityTypeId,
      name: values.name.trim(),
      email: blankToNull({ value: values.email }),
      phone: blankToNull({ value: values.phone }),
      fields: fieldsToInput({ values, specs }),
    }),
  });
}

export type ContactUpdateArgs = {
  contact: ContactDto;
  values: ContactFormOutput;
  type: EntityTypeDto | undefined;
};

/** Create-shaped values → `contact.update` input; emptied fields are cleared with `null`. */
export function toContactUpdate({ contact, values, type }: ContactUpdateArgs): ContactUpdateInput {
  const { entityTypeId: _type, customerId: _customer, fields, ...rest } = values;
  return { id: contact.id, ...rest, fields: fieldsPatch({ type, stored: contact.fields, fields }) };
}
