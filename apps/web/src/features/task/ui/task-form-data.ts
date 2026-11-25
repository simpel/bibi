import type { TaskShape } from "@bibi/core/schemas";
import type { NamedOption } from "@/components/form/named-option";
import type { PersonOption } from "@/components/people/person-name";
import type { ContactOption } from "@/features/order/ui/order-form-data";

/** A task type to pick: its shape decides between start and end, or one due time (ADR 0117). */
export type TaskTypeOption = NamedOption & { shape: TaskShape };

/**
 * What the task pages read besides the task: task types, customers and their contacts, members
 * to assign (`id` = user id), the items a task may name and the caller's user id.
 */
export type TaskFormData = {
  types: TaskTypeOption[];
  customers: NamedOption[];
  contacts: ContactOption[];
  /** The caller may not view customers: show them as hidden and disable the pickers. */
  customersHidden: boolean;
  members: PersonOption[];
  items: NamedOption[];
  /** The signed-in user, the default assignee. */
  meId: string | null;
  /** The organization's zone: task times are entered in it (ADR 0064). */
  timeZone: string;
};
