"use client";

import {
  type ClockFormat,
  ClockFormatSchema,
  type DateFormat,
  DateFormatSchema,
  DEFAULT_CLOCK_FORMAT,
  DEFAULT_DATE_FORMAT,
} from "@bibi/core/schemas";
import { Button, Form } from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useRouter } from "@/lib/navigation";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { saveUserSettings } from "../actions";
import { DisplayFormatFields } from "./display-format-fields";

export const DisplayFormatSchema = z.object({
  dateFormat: DateFormatSchema,
  clockFormat: ClockFormatSchema,
});

export type DisplayFormatValues = z.infer<typeof DisplayFormatSchema>;

export type DisplayFormatFormProps = {
  dateFormat: DateFormat | null;
  clockFormat: ClockFormat | null;
};

/**
 * The signed-in user's date and clock format (ADR 0046). Every option reads as a live example of
 * one sample instant; picking the default stores `null` (inherit, ADR 0051).
 */
export function DisplayFormatForm({ dateFormat, clockFormat }: DisplayFormatFormProps) {
  const t = useTranslations("userSettings");
  const common = useTranslations("common");
  const router = useRouter();
  const form = useForm<DisplayFormatValues>({
    resolver: zodResolver(DisplayFormatSchema, useZodMessages()),
    defaultValues: {
      dateFormat: dateFormat ?? DEFAULT_DATE_FORMAT,
      clockFormat: clockFormat ?? DEFAULT_CLOCK_FORMAT,
    },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) =>
      saveUserSettings({
        dateFormat: values.dateFormat === DEFAULT_DATE_FORMAT ? null : values.dateFormat,
        clockFormat: values.clockFormat === DEFAULT_CLOCK_FORMAT ? null : values.clockFormat,
      }),
    messages: { pending: common("saving"), success: t("saved") },
    onSuccess: () => router.refresh(),
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid max-w-md gap-4">
        <DisplayFormatFields control={form.control} />
        <div>
          <Button type="submit" disabled={pending}>
            {common("save")}
          </Button>
        </div>
      </form>
    </Form>
  );
}
