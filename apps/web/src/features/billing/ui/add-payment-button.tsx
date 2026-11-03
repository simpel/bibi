"use client";

import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { type PlanOption, PlanPicker } from "./plan-picker";

export type AddPaymentButtonProps = { plans: PlanOption[]; seats: string; returnTo: string };

/** "Add payment details" before the trial ends: pick the plan, then Stripe Checkout. */
export function AddPaymentButton({ plans, seats, returnTo }: AddPaymentButtonProps) {
  const t = useTranslations("billing.settings");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        {t("addPaymentDetails")}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t("addPaymentTitle")}</DialogTitle>
            <DialogDescription>{t("addPaymentDescription")}</DialogDescription>
          </DialogHeader>
          <PlanPicker plans={plans} seats={seats} returnTo={returnTo} />
        </DialogContent>
      </Dialog>
    </>
  );
}
