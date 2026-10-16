import type { NamedOption } from "@/components/form/named-option";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";

/** A contact person, with the customer it works for (the form lists the customer's contacts). */
export type ContactOption = NamedOption & { customerId: string };

/**
 * What the inquiry pages read besides the inquiry: inquiry types and lists (own fields), the
 * customers and contacts to pick from and the members who can own an inquiry (`id` = user id).
 */
export type InquiryFormData = TypedFormData & {
  customers: NamedOption[];
  contacts: ContactOption[];
  members: NamedOption[];
};
