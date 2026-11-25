"use client";

import type { OrderTemplateCreateInput } from "@bibi/core/schemas";
import { VisualTile } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { ImageUploadField } from "@/components/form/image-upload-field";
import { OptionSelectField } from "@/components/form/option-select-field";
import { TextField } from "@/components/form/text-field";
import { fileUrl } from "@/lib/file-url";
import type { OrderTemplateFormData } from "./order-template-form-data";
import type { OrderTemplateFormValues } from "./order-template-form-schema";

export type TemplateFieldsProps = {
  form: UseFormReturn<OrderTemplateFormValues, unknown, OrderTemplateCreateInput>;
  data: OrderTemplateFormData;
};

/** The template's own image; without one, it shows its first item's picture. */
export function TemplateImageField({ form }: Pick<TemplateFieldsProps, "form">) {
  const t = useTranslations("orderTemplate.fields");
  const imageKey = form.watch("imageKey");
  return (
    <fieldset className="grid gap-2">
      <legend className="mb-2 text-sm font-medium">{t("image")}</legend>
      <div className="flex items-start gap-4">
        <VisualTile size="lg" src={imageKey ? fileUrl({ key: imageKey }) : null} />
        <ImageUploadField
          imageKey={imageKey}
          onChange={(key) => form.setValue("imageKey", key, { shouldDirty: true })}
          hint={t("imageHint")}
        />
      </div>
    </fieldset>
  );
}

/** Fewest and most guests the template is made for. */
export function TemplateGuestFields({ form }: Pick<TemplateFieldsProps, "form">) {
  const t = useTranslations("orderTemplate.fields");
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <TextField form={form} name="minGuests" label={t("minGuests")} type="number" />
      <TextField form={form} name="maxGuests" label={t("maxGuests")} type="number" />
    </div>
  );
}

/** The booking type orders made from the template get. */
export function TemplateTypeField({ form, data }: TemplateFieldsProps) {
  const t = useTranslations("orderTemplate.fields");
  return (
    <OptionSelectField
      control={form.control}
      name="entityTypeId"
      label={t("orderType")}
      options={data.orderTypes}
    />
  );
}

/** The status orders made from the template start in. */
export function TemplateStatusField({ form, data }: TemplateFieldsProps) {
  const t = useTranslations("orderTemplate.fields");
  return (
    <OptionSelectField
      control={form.control}
      name="statusId"
      label={t("status")}
      options={data.statuses}
    />
  );
}
