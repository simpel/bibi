import type { NamedOption } from "@/components/form/named-option";

/** What the predefined ticket form picks from (everything by name). */
export type TicketTemplateFormData = {
  ticketTypes: NamedOption[];
  /** Program item types, one per line. */
  lineTypes: NamedOption[];
  /** Phases a ticket can start in: not terminal. */
  phases: NamedOption[];
  /** The catalog's items (not a customer's own packages). */
  items: NamedOption[];
  /** The caller may not view items: the picker is disabled and reads "Hidden". */
  itemsHidden: boolean;
};
