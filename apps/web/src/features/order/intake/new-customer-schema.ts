import {
  type CustomerCreateInput,
  CustomerCreateInputSchema,
  CustomerFirstContactInputSchema,
} from "@bibi/core/schemas";
import { blankToNull, blankToUndefined } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";

/** Raw values of the intake's new-customer form: the customer and its first contact person. */
export type NewCustomerValues = {
  name: string;
  /** The customer type, which decides business or private (ADR 0106). */
  entityTypeId: string;
  organizationNumber: string;
  personalIdentityNumber: string;
  contact: { name: string; email: string; entityTypeId: string };
};

/** What the resolver outputs: `customer.create` with the nested contact (ADR 0081). */
export type NewCustomerOutput = CustomerCreateInput;

/**
 * Core's create schema with the contact required, as step 1 asks. Business or private comes from
 * the type in core, which also clears the number that does not fit it.
 */
export const newCustomerSchema = formSchema({
  schema: CustomerCreateInputSchema.safeExtend({ contact: CustomerFirstContactInputSchema }),
  toInput: ({ values }: { values: NewCustomerValues }) => ({
    entityTypeId: values.entityTypeId,
    name: values.name.trim(),
    organizationNumber: blankToNull({ value: values.organizationNumber }),
    personalIdentityNumber: blankToNull({ value: values.personalIdentityNumber }),
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
    organizationNumber: "",
    personalIdentityNumber: "",
    contact: { name: "", email: "", entityTypeId: contactTypeId ?? "" },
  };
}
