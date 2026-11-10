"use client";

import {
  FALLBACK_TIME_ZONE,
  fromZonedParts,
  PaymentRecordManualInputSchema,
  parseIsoDate,
  toIsoDate,
  toZonedParts,
} from "@bibi/core/schemas";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Form,
} from "@bibi/ui";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { DateField } from "@/components/date-picker/date-field";
import { TextField } from "@/components/form/text-field";
import { blankToUndefined, minorOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { useRouter } from "@/lib/navigation";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { useOrganizationTimeZone } from "@/lib/time/use-organization-time-zone";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { recordManualPaymentAction } from "../actions";
import type { ReceivableTarget } from "./use-request-payment-form";

type Values = { amount: string; paidOn: string; note: string };
type Output = z.infer<typeof PaymentRecordManualInputSchema>;

const NOON = { hour: 12, minute: 0, second: 0 } as const;

type DayInput = { day: string; timeZone: string };

/** The paid day at noon in the organization's zone (ADR 0064); a malformed day fails validation. */
const paidAtOf = ({ day, timeZone }: DayInput): Date | string => {
  const date = /^\d{4}-\d{2}-\d{2}$/.test(day) ? parseIsoDate({ value: day }) : null;
  return date ? fromZonedParts({ date, time: NOON, timeZone }) : day;
};

export type RecordPaymentButtonProps = { target: ReceivableTarget; openMinor: number };

type RecordFormProps = RecordPaymentButtonProps & { onDone: () => void };

/** Amount received, the day and a note (e.g. the bank transfer's reference). */
function RecordForm({ target, openMinor, onDone }: RecordFormProps) {
  const t = useTranslations("payment.recordManual");
  const common = useTranslations("common");
  const router = useRouter();
  const { money } = useNumberFormat();
  const timeZone = useOrganizationTimeZone() || FALLBACK_TIME_ZONE;
  const schema = formSchema({
    schema: PaymentRecordManualInputSchema,
    toInput: ({ values }: { values: Values }) => ({
      ...target,
      amountMinor: minorOrNull({ value: values.amount }) ?? undefined,
      paidAt: paidAtOf({ day: values.paidOn, timeZone }),
      note: blankToUndefined({ value: values.note }),
    }),
  });
  const today = toIsoDate({ date: toZonedParts({ instant: new Date(), timeZone }).date });
  const form = useForm<Values, unknown, Output>({
    resolver: zodResolver(schema, useZodMessages()),
    defaultValues: { amount: String(openMinor / 100), paidOn: today, note: "" },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => recordManualPaymentAction({ input: values }),
    messages: { pending: common("saving"), success: t("done") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField
          form={form}
          name="amount"
          label={t("amount")}
          type="number"
          step="0.01"
          required
        />
        <p className="-mt-2 text-xs text-muted-foreground">
          {t("amountHint", { open: money({ minor: openMinor }) })}
        </p>
        <DateField form={form} name="paidOn" label={t("paidOn")} required />
        <TextField form={form} name="note" label={t("note")} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {t("submit")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

/** Records money staff received outside a provider (`payment.recordManual`, ADR 0100). */
export function RecordPaymentButton({ target, openMinor }: RecordPaymentButtonProps) {
  const t = useTranslations("payment.recordManual");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="ghost" onClick={() => setOpen(true)}>
        {t("action")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <RecordForm target={target} openMinor={openMinor} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
