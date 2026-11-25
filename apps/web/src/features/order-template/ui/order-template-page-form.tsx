"use client";

import { Button, Form } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { TextField } from "@/components/form/text-field";
import type { OrderTemplateFormData } from "./order-template-form-data";
import {
  TemplateGuestFields,
  TemplateImageField,
  TemplateStatusField,
  TemplateTypeField,
} from "./template-fields";
import { useOrderTemplateForm } from "./use-order-template-form";

export type OrderTemplatePageFormProps = { data: OrderTemplateFormData };

/**
 * The create page's form: name, image, booking type, start status and guests. Lines are added on
 * the new template's own page, where it opens after saving.
 */
export function OrderTemplatePageForm({ data }: OrderTemplatePageFormProps) {
  const common = useTranslations("common");
  const t = useTranslations("orderTemplate");
  const { form, submit, pending, back } = useOrderTemplateForm({ data });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid max-w-3xl gap-4">
        <TextField form={form} name="name" label={t("fields.name")} required />
        <TemplateImageField form={form} />
        <div className="grid gap-4 sm:grid-cols-2">
          <TemplateTypeField form={form} data={data} />
          <TemplateStatusField form={form} data={data} />
        </div>
        <TemplateGuestFields form={form} />
        <div className="flex gap-2">
          <Button type="button" variant="outline" onClick={back}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {t("create")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
