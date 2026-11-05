"use client";

import type { OrderTemplateCreateInput, OrderTemplateDto } from "@bibi/core/schemas";
import { Button, Form } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type UseFormReturn, useFieldArray } from "react-hook-form";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import type { OrderTemplateFormData } from "./order-template-form-data";
import { emptyLine, type OrderTemplateFormValues } from "./order-template-form-schema";
import { TemplateLineFields } from "./template-line-fields";
import { useOrderTemplateForm } from "./use-order-template-form";

type FormProps = {
  form: UseFormReturn<OrderTemplateFormValues, unknown, OrderTemplateCreateInput>;
  data: OrderTemplateFormData;
};

/** Name, order type, the status orders start in and the guest range. */
function DetailFields({ form, data }: FormProps) {
  const t = useTranslations("orderTemplate.fields");
  return (
    <>
      <TextField form={form} name="name" label={t("name")} required />
      <div className="grid gap-4 sm:grid-cols-2">
        <OptionSelectField
          control={form.control}
          name="entityTypeId"
          label={t("orderType")}
          options={data.orderTypes}
        />
        <OptionSelectField
          control={form.control}
          name="statusId"
          label={t("status")}
          options={data.statuses}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField form={form} name="minGuests" label={t("minGuests")} type="number" />
        <TextField form={form} name="maxGuests" label={t("maxGuests")} type="number" />
      </div>
    </>
  );
}

/** The lines, each removable, and a button that appends an empty one. */
function LinesEditor({ form, data }: FormProps) {
  const t = useTranslations("orderTemplate");
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

export type OrderTemplatePageFormProps = {
  data: OrderTemplateFormData;
  template?: OrderTemplateDto | undefined;
};

/** The predefined order form on its create or update page: details first, then the lines. */
export function OrderTemplatePageForm({ data, template }: OrderTemplatePageFormProps) {
  const common = useTranslations("common");
  const { form, submit, pending, back } = useOrderTemplateForm({ data, template });
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
