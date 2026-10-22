"use client";

import type { TicketTemplateCreateInput, TicketTemplateDto } from "@bibi/core/schemas";
import { Button, Form } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type UseFormReturn, useFieldArray } from "react-hook-form";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import { TemplateLineFields } from "./template-line-fields";
import type { TicketTemplateFormData } from "./ticket-template-form-data";
import { emptyLine, type TicketTemplateFormValues } from "./ticket-template-form-schema";
import { useTicketTemplateForm } from "./use-ticket-template-form";

type FormProps = {
  form: UseFormReturn<TicketTemplateFormValues, unknown, TicketTemplateCreateInput>;
  data: TicketTemplateFormData;
};

/** Name, ticket type and the phase tickets start in. */
function DetailFields({ form, data }: FormProps) {
  const t = useTranslations("ticketTemplate.fields");
  return (
    <>
      <TextField form={form} name="name" label={t("name")} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <OptionSelectField
          control={form.control}
          name="entityTypeId"
          label={t("ticketType")}
          options={data.ticketTypes}
        />
        <OptionSelectField
          control={form.control}
          name="phaseId"
          label={t("phase")}
          options={data.phases}
        />
      </div>
    </>
  );
}

/** The lines, each removable, and a button that appends an empty one. */
function LinesEditor({ form, data }: FormProps) {
  const t = useTranslations("ticketTemplate");
  const lines = useFieldArray({ control: form.control, name: "lines" });
  return (
    <>
      <h2 className="mt-2 text-base font-medium">{t("lines")}</h2>
      {lines.fields.map((line, index) => (
        <TemplateLineFields
          key={line.id}
          form={form}
          data={data}
          index={index}
          onRemove={() => lines.remove(index)}
        />
      ))}
      <Button
        type="button"
        variant="outline"
        className="justify-self-start"
        onClick={() => lines.append(emptyLine({ entityTypeId: data.lineTypes[0]?.id ?? "" }))}
      >
        <PlusIcon />
        {t("addLine")}
      </Button>
    </>
  );
}

export type TicketTemplatePageFormProps = {
  data: TicketTemplateFormData;
  template?: TicketTemplateDto | undefined;
};

/** The predefined ticket form on its create or update page: details first, then the lines. */
export function TicketTemplatePageForm({ data, template }: TicketTemplatePageFormProps) {
  const common = useTranslations("common");
  const { form, submit, pending, back } = useTicketTemplateForm({ data, template });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid max-w-3xl gap-4">
        <DetailFields form={form} data={data} />
        <LinesEditor form={form} data={data} />
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={back}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {common("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
