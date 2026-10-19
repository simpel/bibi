import type { TicketPhaseDto } from "@okazi/core";
import type { NamedOption } from "@/components/form/named-option";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";

/** A contact person, with the customer it works for (the form lists the customer's contacts). */
export type ContactOption = NamedOption & { customerId: string };

/**
 * What the ticket pages read besides the ticket: ticket types and lists (own fields), the
 * customers and contacts to pick from, the members who can be assigned (`id` = user id) and the
 * organization's phases.
 */
export type TicketFormData = TypedFormData & {
  customers: NamedOption[];
  contacts: ContactOption[];
  /** The caller may not view customers: show them as hidden and disable the pickers. */
  customersHidden: boolean;
  members: NamedOption[];
  phases: TicketPhaseDto[];
};
