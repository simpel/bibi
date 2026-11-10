"use client";

import { PaymentRefundInputSchema } from "@bibi/core/schemas";
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
import { TextField } from "@/components/form/text-field";
import { blankToUndefined, minorOrNull } from "@/lib/blank";
import { formSchema } from "@/lib/form-schema";
import { useRouter } from "@/lib/navigation";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { useFormAction } from "@/lib/use-form-action";
import { useZodMessages } from "@/lib/use-zod-messages";
import { refundPaymentAction } from "../actions";

type Values = { amount: string; reason: string };
type Output = z.infer<typeof PaymentRefundInputSchema>;

export type RefundPaymentButtonProps = {
  payment: { id: string; refundableMinor: number; currency: string };
};

type RefundFormProps = RefundPaymentButtonProps & { onDone: () => void };

/** Amount (empty = all that is left) and why; the refund goes back where the money came from. */
function RefundForm({ payment, onDone }: RefundFormProps) {
  const t = useTranslations("payment.refund");
  const common = useTranslations("common");
  const router = useRouter();
  const { money } = useNumberFormat();
  const schema = formSchema({
    schema: PaymentRefundInputSchema,
    toInput: ({ values }: { values: Values }) => ({
      id: payment.id,
      amountMinor: minorOrNull({ value: values.amount }) ?? undefined,
      reason: blankToUndefined({ value: values.reason }),
    }),
  });
  const form = useForm<Values, unknown, Output>({
    resolver: zodResolver(schema, useZodMessages()),
    defaultValues: { amount: "", reason: "" },
  });
  const { submit, pending } = useFormAction({
    form,
    action: ({ values }) => refundPaymentAction({ input: values }),
    messages: { pending: common("saving"), success: t("done") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  const left = money({ minor: payment.refundableMinor, currency: payment.currency });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField form={form} name="amount" label={t("amount")} type="number" step="0.01" />
        <p className="-mt-2 text-xs text-muted-foreground">{t("amountHint", { left })}</p>
        <TextField form={form} name="reason" label={t("reason")} multiline rows={2} />
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

/** Refunds a paid payment in full or in part (`payment.refund`, ADR 0100). */
export function RefundPaymentButton({ payment }: RefundPaymentButtonProps) {
  const t = useTranslations("payment.refund");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        {t("action")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <RefundForm payment={payment} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
