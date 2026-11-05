import type { OrderStatusDto } from "@bibi/core";
import type { NamedOption } from "@/components/form/named-option";
import type { PersonOption } from "@/components/people/person-name";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";

/** A contact person, with the customer it works for (the form lists the customer's contacts). */
export type ContactOption = PersonOption & { customerId: string };

/**
 * What the order pages read besides the order: order types and lists (own fields), the
 * customers and contacts to pick from, the members who can be assigned (`id` = user id) and the
 * organization's statuses.
 */
export type OrderFormData = TypedFormData & {
  customers: NamedOption[];
  contacts: ContactOption[];
  /** The caller may not view customers: show them as hidden and disable the pickers. */
  customersHidden: boolean;
  /** With their email, for their contact card. */
  members: PersonOption[];
  statuses: OrderStatusDto[];
};
