"use client";

import {
  ClockFormatSchema,
  DateFormatSchema,
  DEFAULT_CLOCK_FORMAT,
  DEFAULT_DATE_FORMAT,
  DEFAULT_MONEY_FORMAT,
  type DisplayFormats,
  MoneyFormatSchema,
  NumberFormatSchema,
} from "@bibi/core/schemas";
import { Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useSaveOnChange } from "@/lib/use-save-on-change";
import { useZodMessages } from "@/lib/use-zod-messages";
import { saveUserSettings } from "../actions";
import { DisplayFormatFields } from "./display-format-fields";
import { LANGUAGE_NUMBER_FORMAT } from "./number-format-options";

export const DisplayFormatSchema = z.object({
  dateFormat: DateFormatSchema,
  clockFormat: ClockFormatSchema,
  numberFormat: z.union([NumberFormatSchema, z.literal(LANGUAGE_NUMBER_FORMAT)]),
  moneyFormat: MoneyFormatSchema,
});

export type DisplayFormatValues = z.infer<typeof DisplayFormatSchema>;

export type DisplayFormatFormProps = { formats: DisplayFormats };

/**
 * The signed-in user's date, clock, number and currency format (ADR 0046, #482). Every option reads as a live example of
 * one sample instant; picking the default stores `null` (inherit, ADR 0051). Each pick saves at once.
 */
export function DisplayFormatForm({ formats }: DisplayFormatFormProps) {
  const t = useTranslations("userSettings");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<DisplayFormatValues>({
    resolver: zodResolver(DisplayFormatSchema, useZodMessages()),
    defaultValues: {
      dateFormat: formats.dateFormat ?? DEFAULT_DATE_FORMAT,
      clockFormat: formats.clockFormat ?? DEFAULT_CLOCK_FORMAT,
      numberFormat: formats.numberFormat ?? LANGUAGE_NUMBER_FORMAT,
      moneyFormat: formats.moneyFormat ?? DEFAULT_MONEY_FORMAT,
    },
  });
  const { run } = useFormAction({
    form,
    action: ({ values }) =>
      saveUserSettings({
        dateFormat: values.dateFormat === DEFAULT_DATE_FORMAT ? null : values.dateFormat,
        clockFormat: values.clockFormat === DEFAULT_CLOCK_FORMAT ? null : values.clockFormat,
        numberFormat: values.numberFormat === LANGUAGE_NUMBER_FORMAT ? null : values.numberFormat,
        moneyFormat: values.moneyFormat === DEFAULT_MONEY_FORMAT ? null : values.moneyFormat,
      }),
    messages: { pending: common("saving"), success: t("saved") },
    onSuccess: () => {
      form.reset(form.getValues());
      router.refresh();
    },
    onError: () => form.reset(),
  });
  useSaveOnChange({ form, run });
  return (
    <Form {...form}>
      <form onSubmit={(event) => event.preventDefault()} noValidate className="grid max-w-md gap-4">
        <DisplayFormatFields control={form.control} />
      </form>
    </Form>
  );
}
