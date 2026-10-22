"use client";

import { Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import { TemplateTicketActions } from "./template-ticket-actions";
import type { TemplateTicketFormData } from "./template-ticket-form-data";
import { useTemplateTicketForm } from "./use-template-ticket-form";

export type TemplateTicketFormProps = { data: TemplateTicketFormData };

/** The short form on `/new/ticket`: customer, predefined ticket, start and headcount. */
export function TemplateTicketForm({ data }: TemplateTicketFormProps) {
  const t = useTranslations("ticket.fields");
  const none = useTranslations("ticket");
  const { form, submit, pending } = useTemplateTicketForm();
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid max-w-2xl gap-4">
        <OptionSelectField
          control={form.control}
          name="customerId"
          label={t("customer")}
          options={data.customers}
          hidden={data.customersHidden}
        />
        <OptionSelectField
          control={form.control}
          name="templateId"
          label={t("template")}
          options={data.templates}
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField form={form} name="startsAt" label={t("startsAt")} type="datetime-local" />
          <TextField form={form} name="headcount" label={t("headcount")} type="number" />
        </div>
        {data.members.length > 0 ? (
          <OptionSelectField
            control={form.control}
            name="assigneeId"
            label={t("assignee")}
            options={data.members}
            noneLabel={none("noAssignee")}
          />
        ) : null}
        <TemplateTicketActions pending={pending} />
      </form>
    </Form>
  );
}
