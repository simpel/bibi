import type { NamedOption } from "@/components/form/named-option";
import type { CustomisableItem } from "@/features/line/ui/program-form-data";

/** What the predefined ticket form picks from (everything by name). */
export type TicketTemplateFormData = {
  ticketTypes: NamedOption[];
  /** Line types, one per line. */
  lineTypes: NamedOption[];
  /** Statuses a ticket can start in: not closing. */
  statuses: NamedOption[];
  /** The catalog's items (not a customer's own bundles). */
  items: NamedOption[];
  /** The caller may not view items: the picker is disabled and reads "Hidden". */
  itemsHidden: boolean;
  /** Items with customisation groups, so a line can preselect choices (ADR 0089). */
  customisable: CustomisableItem[];
};
