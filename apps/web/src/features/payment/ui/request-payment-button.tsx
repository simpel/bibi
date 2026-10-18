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
} from "@okazi/ui";
import { CreditCardIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { TextField } from "@/components/form/text-field";
import { PaymentMethodField } from "./payment-method-field";
import { useRequestPaymentForm } from "./use-request-payment-form";

type RequestPaymentFormProps = { ticketId: string; onDone: () => void };

function RequestPaymentForm({ ticketId, onDone }: RequestPaymentFormProps) {
  const common = useTranslations("common");
  const t = useTranslations("payment");
  const { form, submit, pending } = useRequestPaymentForm({ ticketId, onDone });
  return (
    <Form {...form}>
      <form onSubmit={submit} noValidate className="grid gap-4">
        <PaymentMethodField form={form} />
        <TextField
          form={form}
          name="amount"
          label={t("fields.amount")}
          type="number"
          step="0.01"
          required
        />
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

/** Opens the dialog that requests a payment from the ticket's customer (`payment.create`). */
export function RequestPaymentButton({ ticketId }: { ticketId: string }) {
  const t = useTranslations("payment");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <CreditCardIcon />
        {t("request")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("request")}</DialogTitle>
            <DialogDescription>{t("requestDescription")}</DialogDescription>
          </DialogHeader>
          <RequestPaymentForm ticketId={ticketId} onDone={() => setOpen(false)} />
        </DialogContent>
      </Dialog>
    </>
  );
}
