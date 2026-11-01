import type { NamedOption } from "@/components/form/named-option";
import type { ContactOption } from "./ticket-form-data";

/** What the short create form picks from (by name); members' `id` is the user id. */
export type TemplateTicketFormData = {
  templates: NamedOption[];
  customers: NamedOption[];
  /** The caller may not view customers: the picker is disabled and reads "Hidden". */
  customersHidden: boolean;
  /** Contact persons; the picker lists the chosen customer's. */
  contacts: ContactOption[];
  members: NamedOption[];
};
