"use client";

import { InvoiceCreditInputSchema } from "@bibi/core/schemas";
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
import { creditInvoiceAction } from "../../invoice/actions";

type Values = { amount: string; reason: string };
type Output = z.infer<typeof InvoiceCreditInputSchema>;

export type CreditInvoiceButtonProps = {
  invoice: { id: string; documentNumber: string | null; amountDueMinor: number; currency: string };
};

type CreditFormProps = CreditInvoiceButtonProps & { onDone: () => void };

/** Amount incl. VAT (empty = all that is still due) and why, shown on the credit note. */
function CreditForm({ invoice, onDone }: CreditFormProps) {
  const t = useTranslations("invoice.credit");
  const common = useTranslations("common");
  const router = useRouter();
  const { money } = useNumberFormat();
  const schema = formSchema({
    schema: InvoiceCreditInputSchema,
    toInput: ({ values }: { values: Values }) => ({
      invoiceId: invoice.id,
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
    action: ({ values }) => creditInvoiceAction({ input: values }),
    messages: { pending: common("saving"), success: t("done") },
    onSuccess: () => {
      router.refresh();
      onDone();
    },
  });
  const due = money({ minor: invoice.amountDueMinor, currency: invoice.currency });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <TextField form={form} name="amount" label={t("amount")} type="number" step="0.01" />
        <p className="-mt-2 text-xs text-muted-foreground">{t("amountHint", { due })}</p>
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

/** Credits a sent invoice in full or in part with a credit note (`invoice.credit`, ADR 0100). */
export function CreditInvoiceButton({ invoice }: CreditInvoiceButtonProps) {
  const t = useTranslations("invoice.credit");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => setOpen(true)}>
        {t("action")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("title", { number: invoice.documentNumber ?? "–" })}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <CreditForm invoice={invoice} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
