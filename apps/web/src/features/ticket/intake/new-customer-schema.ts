import {
  type CustomerCreateInput,
  CustomerCreateInputSchema,
  CustomerFirstContactInputSchema,
} from "@bibi/core/schemas";
import { blankToUndefined } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the intake's new-customer form: the customer and its first contact person. */
export type NewCustomerValues = {
  name: string;
  entityTypeId: string;
  contact: { name: string; email: string; entityTypeId: string };
};

/** What the resolver outputs: `customer.create` with the nested contact (ADR 0081). */
export type NewCustomerOutput = CustomerCreateInput;

/** Core's create schema with the contact required, as step 1 asks for it. */
export const newCustomerSchema = formSchema({
  schema: CustomerCreateInputSchema.extend({ contact: CustomerFirstContactInputSchema }),
  toInput: ({ values }: { values: NewCustomerValues }) => ({
    entityTypeId: values.entityTypeId,
    name: values.name.trim(),
    contact: {
      name: values.contact.name.trim(),
      email: values.contact.email.trim(),
      entityTypeId: blankToUndefined({ value: values.contact.entityTypeId }),
    },
  }),
});

export type NewCustomerDefaultsInput = {
  name: string;
  customerTypeId: string | undefined;
  contactTypeId: string | undefined;
};

export function newCustomerDefaults({
  name,
  customerTypeId,
  contactTypeId,
}: NewCustomerDefaultsInput): NewCustomerValues {
  return {
    name,
    entityTypeId: customerTypeId ?? "",
    contact: { name: "", email: "", entityTypeId: contactTypeId ?? "" },
  };
}
