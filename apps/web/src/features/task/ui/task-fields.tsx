import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { DateTimeField } from "@/components/date-picker/date-time-field";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import type { TaskFormData } from "./task-form-data";
import type { TaskFormOutput, TaskFormValues } from "./task-form-schema";

export type TaskFieldsForm = UseFormReturn<TaskFormValues, unknown, TaskFormOutput>;

type FieldsProps = { form: TaskFieldsForm; data: TaskFormData };

/** The task type; its shape decides the time fields. */
export function TaskTypeField({ form, data }: FieldsProps) {
  const t = useTranslations("task.fields");
  return (
    <OptionSelectField
      control={form.control}
      name="entityTypeId"
      label={t("type")}
      options={data.types}
    />
  );
}

/** The customer (only on create: it never changes) and a contact person who works there. */
export function TaskCustomerFields({
  form,
  data,
  withCustomer,
}: FieldsProps & { withCustomer: boolean }) {
  const t = useTranslations("task.fields");
  const customerId = form.watch("customerId");
  const contacts = data.contacts.filter((contact) => contact.customerId === customerId);
  return (
    <>
      {withCustomer ? (
        <OptionSelectField
          control={form.control}
          name="customerId"
          label={t("customer")}
          options={data.customers}
          hidden={data.customersHidden}
          onChange={() => form.setValue("contactId", "")}
        />
      ) : null}
      <OptionSelectField
        control={form.control}
        name="contactId"
        label={t("contact")}
        options={contacts}
        hidden={data.customersHidden}
      />
    </>
  );
}

/** A meeting's start and end, or a deadline's one due time. */
export function TaskWhenFields({ form, data }: FieldsProps) {
  const t = useTranslations("task.fields");
  const typeId = form.watch("entityTypeId");
  const shape = data.types.find((type) => type.id === typeId)?.shape ?? "MEETING";
  if (shape === "DEADLINE") {
    return <DateTimeField form={form} name="startsAt" label={t("dueAt")} required />;
  }
  return (
    // Side by side only when the form itself is wide (the create page), stacked in a popover.
    <div className="@container">
      <div className="grid gap-4 @xl:grid-cols-2">
        <DateTimeField form={form} name="startsAt" label={t("startsAt")} required />
        <DateTimeField form={form} name="endsAt" label={t("endsAt")} required />
      </div>
    </div>
  );
}

/** The item it names (e.g. the room to show); it only warns when busy. */
export function TaskItemField({ form, data }: FieldsProps) {
  const t = useTranslations("task.fields");
  return (
    <OptionSelectField
      control={form.control}
      name="itemId"
      label={t("item")}
      options={data.items}
      noneLabel={t("noItem")}
    />
  );
}

/** Who does it; the caller by default. */
export function TaskAssigneeField({ form, data }: FieldsProps) {
  const t = useTranslations("task.fields");
  return (
    <OptionSelectField
      control={form.control}
      name="assigneeId"
      label={t("assignee")}
      options={data.members}
      noneLabel={t("unassigned")}
    />
  );
}

/** Free text, e.g. what came out of the visit. */
export function TaskNoteField({ form }: Pick<FieldsProps, "form">) {
  const t = useTranslations("task.fields");
  return <TextField form={form} name="note" label={t("note")} multiline rows={4} />;
}
