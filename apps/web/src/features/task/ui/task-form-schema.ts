import type { TaskDto } from "@bibi/core";
import { TaskCreateInputSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import { NONE } from "@/components/form/option-select-field";
import { formSchema } from "@/lib/form-schema";
import { fromLocalInputValue, toLocalInputValue } from "../../occupancy/ui/local-date-time";
import type { TaskFormData } from "./task-form-data";

/** Raw values of the task form: times as `YYYY-MM-DDTHH:mm` in the organization's zone. */
export type TaskFormValues = {
  entityTypeId: string;
  customerId: string;
  contactId: string;
  /** `NONE` = not linked. */
  orderId: string;
  /** `NONE` = no item. */
  itemId: string;
  startsAt: string;
  endsAt: string;
  note: string;
  /** `NONE` = unassigned. */
  assigneeId: string;
};

/** What the resolver outputs: core's create input. */
export type TaskFormOutput = z.infer<typeof TaskCreateInputSchema>;

type SchemaInput = { data: Pick<TaskFormData, "types" | "timeZone"> };

const orNull = ({ value }: { value: string }) => (value === NONE || value === "" ? null : value);

/** Core's create schema over the raw values; a deadline sends no end. */
export function taskFormSchema({ data }: SchemaInput) {
  const instant = ({ value }: { value: string }) =>
    fromLocalInputValue({ value, timeZone: data.timeZone });
  return formSchema({
    schema: TaskCreateInputSchema,
    toInput: ({ values }: { values: TaskFormValues }) => {
      const shape = data.types.find((type) => type.id === values.entityTypeId)?.shape;
      return {
        entityTypeId: values.entityTypeId,
        customerId: values.customerId,
        contactId: values.contactId,
        ...(orNull({ value: values.orderId }) ? { orderId: values.orderId } : {}),
        itemId: orNull({ value: values.itemId }),
        startsAt: instant({ value: values.startsAt }),
        endsAt: shape === "DEADLINE" ? null : (instant({ value: values.endsAt }) ?? null),
        note: values.note.trim() === "" ? null : values.note,
        assigneeId: orNull({ value: values.assigneeId }),
      };
    },
  });
}

export type TaskPrefill = {
  customerId?: string | undefined;
  contactId?: string | undefined;
  orderId?: string | undefined;
  itemId?: string | undefined;
  startsAt?: Date | undefined;
  endsAt?: Date | undefined;
};

type DefaultsInput = {
  data: TaskFormData;
  /** Present on the detail page: its values. */
  task?: TaskDto | undefined;
  prefill?: TaskPrefill | undefined;
};

/** The first type, the caller as assignee and the prefill (customer, order, a calendar slot). */
export function taskFormDefaults({ data, task, prefill }: DefaultsInput): TaskFormValues {
  const local = ({ date }: { date: Date | null | undefined }) =>
    date ? toLocalInputValue({ date, timeZone: data.timeZone }) : "";
  const customerId = task?.customerId ?? prefill?.customerId ?? "";
  const contacts = data.contacts.filter((contact) => contact.customerId === customerId);
  return {
    entityTypeId: task?.type.id ?? data.types[0]?.id ?? "",
    customerId,
    contactId:
      task?.contactId ??
      prefill?.contactId ??
      (contacts.length === 1 ? (contacts[0]?.id ?? "") : ""),
    orderId: task?.orderId ?? prefill?.orderId ?? NONE,
    itemId: task?.itemId ?? prefill?.itemId ?? NONE,
    startsAt: local({ date: task?.startsAt ?? prefill?.startsAt }),
    endsAt: local({ date: task?.endsAt ?? prefill?.endsAt }),
    note: task?.note ?? "",
    assigneeId: (task ? task.assigneeId : data.meId) ?? NONE,
  };
}
