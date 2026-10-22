"use client";

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
import { CreditCardIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { TextField } from "@/components/form/text-field";
import { PaymentMethodField } from "./payment-method-field";
import { useMoney } from "./use-money";
import { type ReceivableTarget, useRequestPaymentForm } from "./use-request-payment-form";

type RequestPaymentFormProps = { target: ReceivableTarget; openMinor: number; onDone: () => void };

function RequestPaymentForm({ target, openMinor, onDone }: RequestPaymentFormProps) {
  const common = useTranslations("common");
  const t = useTranslations("payment");
  const money = useMoney();
  const { form, submit, pending } = useRequestPaymentForm({ target, onDone });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <PaymentMethodField form={form} />
        <TextField form={form} name="amount" label={t("fields.amount")} type="number" step="0.01" />
        <p className="-mt-2 text-xs text-muted-foreground">
          {t("amountHint", { open: money({ minor: openMinor }) })}
        </p>
        <TextField form={form} name="description" label={t("fields.description")} />
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onDone}>
            {common("cancel")}
          </Button>
          <Button type="submit" disabled={pending}>
            {t("request")}
          </Button>
        </DialogFooter>
      </form>
    </Form>
  );
}

export type RequestPaymentButtonProps = { target: ReceivableTarget; openMinor: number };

/** Opens the dialog that requests a payment against one receivable (`payment.create`). */
export function RequestPaymentButton({ target, openMinor }: RequestPaymentButtonProps) {
  const t = useTranslations("payment");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <CreditCardIcon />
        {t("request")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("request")}</DialogTitle>
            <DialogDescription>{t("requestDescription")}</DialogDescription>
          </DialogHeader>
          <RequestPaymentForm target={target} openMinor={openMinor} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
