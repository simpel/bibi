import type { NamedOption } from "@/components/form/named-option";
import type { PersonOption } from "@/components/people/person-name";
import type { ContactOption } from "@/features/order/ui/order-form-data";

/**
 * What the task pages read besides the task: task types, customers and their contacts, members
 * to assign (`id` = user id), the rooms a task may name or hold and the caller's user id.
 */
export type TaskFormData = {
  types: NamedOption[];
  /** `configuration:write`: the form offers Create type beside the type picker. */
  canCreateType: boolean;
  customers: NamedOption[];
  contacts: ContactOption[];
  /** The caller may not view customers: show them as hidden and disable the pickers. */
  customersHidden: boolean;
  members: PersonOption[];
  /** Bookable items only (ADR 0120): the rooms a task may name, prebook or book. */
  items: NamedOption[];
  /** The signed-in user, the default assignee. */
  meId: string | null;
  /** The organization's zone: task times are entered in it (ADR 0064). */
  timeZone: string;
};
