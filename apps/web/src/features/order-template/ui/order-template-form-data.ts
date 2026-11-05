import type { NamedOption } from "@/components/form/named-option";
import type { CustomisableItem } from "@/features/line/ui/program-form-data";

/** What the predefined order form picks from (everything by name). */
export type OrderTemplateFormData = {
  orderTypes: NamedOption[];
  /** Line types, one per line. */
  lineTypes: NamedOption[];
  /** Statuses an order can start in: not closing. */
  statuses: (NamedOption & { color?: string | undefined })[];
  /** The catalog's items (not a customer's own bundles). */
  items: NamedOption[];
  /** The caller may not view items: the picker is disabled and reads "Hidden". */
  itemsHidden: boolean;
  /** Items with customisation groups, so a line can preselect choices (ADR 0089). */
  customisable: CustomisableItem[];
};
