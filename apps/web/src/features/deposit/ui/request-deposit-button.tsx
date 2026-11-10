"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@bibi/ui";
import { LinkIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { MethodRequiredButton } from "@/features/payment/ui/method-required-button";
import { usePaymentLinksAvailable } from "@/features/payment/ui/payment-links-context";
import { RequestDepositForm } from "./request-deposit-form";

/** The deposit rule's suggestion, prepared on the server (amounts already formatted). */
export type DepositSuggestionView = {
  basis: "PERCENT" | "FULL" | "NONE";
  /** Kronor text for the amount field; empty when there is no rule. */
  defaultAmount: string;
  /** The order's total incl. VAT, formatted. */
  total: string;
};

export type RequestDepositButtonProps = { orderId: string; suggestion: DepositSuggestionView };

/** Opens the dialog that asks the customer for a deposit and shows its payment link. */
export function RequestDepositButton({ orderId, suggestion }: RequestDepositButtonProps) {
  const t = useTranslations("deposit.request");
  const [open, setOpen] = useState(false);
  if (!usePaymentLinksAvailable()) {
    return (
      <MethodRequiredButton>
        <LinkIcon />
        {t("action")}
      </MethodRequiredButton>
    );
  }
  return (
    <>
      <Button variant="outline" onClick={() => setOpen(true)}>
        <LinkIcon />
        {t("action")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <RequestDepositForm
            key={String(open)}
            orderId={orderId}
            suggestion={suggestion}
            onDone={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
