import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { DateTimeField } from "@/components/date-picker/date-time-field";
import { NONE, OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import type { TaskFormData } from "./task-form-data";
import type { TaskFormOutput, TaskFormValues } from "./task-form-schema";

export type TaskFieldsForm = UseFormReturn<TaskFormValues, unknown, TaskFormOutput>;

type FieldsProps = { form: TaskFieldsForm; data: TaskFormData };

/** The task type, the one required field. */
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

/** The customer (optional; not in the contact-only editor) and a contact person who works there. */
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
          noneLabel={t("noCustomer")}
          hidden={data.customersHidden}
          onChange={(next) => {
            const own = data.contacts.filter((contact) => contact.customerId === next);
            form.setValue("contactId", own.length === 1 ? (own[0]?.id ?? NONE) : NONE);
            // An order belongs to its customer: another customer, or none, starts unlinked.
            form.setValue("orderId", NONE);
          }}
        />
      ) : null}
      {customerId !== NONE ? (
        <OptionSelectField
          control={form.control}
          name="contactId"
          label={t("contact")}
          options={contacts}
          noneLabel={t("noContact")}
          hidden={data.customersHidden}
        />
      ) : null}
    </>
  );
}

/** The one due time: optional, never a span (ADR 0120). The date button clears it. */
export function TaskDueField({ form }: Pick<FieldsProps, "form">) {
  const t = useTranslations("task.fields");
  return <DateTimeField form={form} name="dueAt" label={t("dueAt")} />;
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
