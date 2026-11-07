"use client";

import {
  Button,
  type ButtonProps,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type ReactNode, useState } from "react";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

export type StripeRequiredButtonProps = Pick<ButtonProps, "size"> & { children: ReactNode };

/**
 * A payment-link action while the organization has no active Stripe account (ADR 0090): shown
 * dimmed, and a click explains that Stripe must be connected first instead of doing anything.
 */
export function StripeRequiredButton({ size, children }: StripeRequiredButtonProps) {
  const t = useTranslations("payment.stripeRequired");
  const common = useTranslations("common");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button
        variant="outline"
        size={size}
        aria-disabled
        className="opacity-50"
        onClick={() => setOpen(true)}
      >
        {children}
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t("title")}</DialogTitle>
            <DialogDescription>{t("description")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {common("close")}
            </Button>
            <Button variant="stripe" asChild>
              <Link href={ROUTES.adminPayments}>{t("connect")}</Link>
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
