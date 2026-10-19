import type { NamedOption } from "@/components/form/named-option";

/** What the short create form picks from (by name); members' `id` is the user id. */
export type TemplateTicketFormData = {
  templates: NamedOption[];
  customers: NamedOption[];
  /** The caller may not view customers: the picker is disabled and reads "Hidden". */
  customersHidden: boolean;
  members: NamedOption[];
};
