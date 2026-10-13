"use client";

import type { RoomCreateInput } from "@okazi/core";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { CheckField } from "@/components/form/check-field";
import { TextField } from "@/components/form/text-field";
import type { RoomFormValues } from "./room-form-schema";

export type RoomFormFieldsProps = {
  form: UseFormReturn<RoomFormValues, unknown, RoomCreateInput>;
};

export function RoomFormFields({ form }: RoomFormFieldsProps) {
  const t = useTranslations("room.fields");
  return (
    <div className="grid gap-4">
      <TextField form={form} name="name" label={t("name")} required />
      <TextField form={form} name="description" label={t("description")} multiline />
      <div className="grid grid-cols-2 gap-4">
        <TextField form={form} name="floor" label={t("floor")} />
        <TextField form={form} name="maxCapacity" label={t("maxCapacity")} type="number" />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <TextField form={form} name="areaSqm" label={t("areaSquareMeters")} type="number" step="any" />
        <TextField form={form} name="ceilingHeightM" label={t("ceilingHeightM")} type="number" step="any" />
      </div>
      <CheckField form={form} name="hasDaylight" label={t("hasDaylight")} />
    </div>
  );
}
