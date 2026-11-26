import type { TaskDto } from "@bibi/core";
import { TaskCreateInputSchema } from "@bibi/core/schemas";
import type { z } from "zod";
import { NONE } from "@/components/form/option-select-field";
import { formSchema } from "@/lib/form-schema";
import { fromLocalInputValue, toLocalInputValue } from "../../occupancy/ui/local-date-time";
import { type TaskRoomValues, toItemInput } from "../lib/task-rooms";
import type { TaskFormData } from "./task-form-data";

/** Raw values of the task form: times as `YYYY-MM-DDTHH:mm` in the organization's zone. */
export type TaskFormValues = {
  entityTypeId: string;
  /** `NONE` = no customer. */
  customerId: string;
  /** `NONE` = no contact person. */
  contactId: string;
  /** `NONE` = not linked. */
  orderId: string;
  /** Empty = no due time. */
  dueAt: string;
  note: string;
  /** `NONE` = unassigned. */
  assigneeId: string;
  items: TaskRoomValues[];
};

/** What the resolver outputs: core's create input. */
export type TaskFormOutput = z.infer<typeof TaskCreateInputSchema>;

type SchemaInput = { data: Pick<TaskFormData, "timeZone"> };

const orNull = ({ value }: { value: string }) => (value === NONE || value === "" ? null : value);

/** Core's create schema over the raw values; only the type is required (ADR 0120). */
export function taskFormSchema({ data }: SchemaInput) {
  return formSchema({
    schema: TaskCreateInputSchema,
    toInput: ({ values }: { values: TaskFormValues }) => {
      const customerId = orNull({ value: values.customerId });
      const contactId = orNull({ value: values.contactId });
      const orderId = orNull({ value: values.orderId });
      return {
        entityTypeId: values.entityTypeId,
        ...(customerId ? { customerId } : {}),
        ...(contactId ? { contactId } : {}),
        ...(orderId ? { orderId } : {}),
        dueAt: fromLocalInputValue({ value: values.dueAt, timeZone: data.timeZone }),
        items: values.items.map((room) => toItemInput({ room, timeZone: data.timeZone })),
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
  /** A calendar slot's room: named as a related room, never held. */
  itemId?: string | undefined;
  /** A calendar slot's start: the due time. */
  dueAt?: Date | undefined;
};

type DefaultsInput = {
  data: TaskFormData;
  /** Present on the detail page: its values. */
  task?: TaskDto | undefined;
  prefill?: TaskPrefill | undefined;
};

/** The first type, the caller as assignee, and the prefill (customer, order, a calendar slot). */
export function taskFormDefaults({ data, task, prefill }: DefaultsInput): TaskFormValues {
  const local = ({ date }: { date: Date | null | undefined }) =>
    date ? toLocalInputValue({ date, timeZone: data.timeZone }) : "";
  const customerId = task ? task.customerId : (prefill?.customerId ?? null);
  const contacts = data.contacts.filter((contact) => contact.customerId === customerId);
  const contactId = task
    ? task.contactId
    : (prefill?.contactId ?? (contacts.length === 1 ? (contacts[0]?.id ?? null) : null));
  const rooms: TaskRoomValues[] = prefill?.itemId
    ? [{ itemId: prefill.itemId, hold: "RELATED", startsAt: "", endsAt: "" }]
    : [];
  return {
    entityTypeId: task?.type.id ?? data.types[0]?.id ?? "",
    customerId: customerId ?? NONE,
    contactId: contactId ?? NONE,
    orderId: task?.orderId ?? prefill?.orderId ?? NONE,
    dueAt: local({ date: task ? task.dueAt : prefill?.dueAt }),
    note: task?.note ?? "",
    assigneeId: (task ? task.assigneeId : data.meId) ?? NONE,
    items: rooms,
  };
}
