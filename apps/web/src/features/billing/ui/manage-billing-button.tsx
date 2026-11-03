"use client";

import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useToastAction } from "@/lib/use-toast-action";
import { openBillingPortalAction } from "../actions";

export type ManageBillingButtonProps = { returnTo: string };

/** Stripe's Customer Portal: card, invoices, plan and cancelling. */
export function ManageBillingButton({ returnTo }: ManageBillingButtonProps) {
  const t = useTranslations("billing.settings");
  const { run, pending } = useToastAction();
  const open = () =>
    run({
      action: () => openBillingPortalAction({ input: { returnTo } }),
      messages: { pending: t("openingPortal"), success: t("redirecting") },
      onSuccess: ({ value }) => {
        if (value.url) window.location.assign(value.url);
      },
    });
  return (
    <Button type="button" variant="outline" disabled={pending} onClick={open}>
      {t("manage")}
    </Button>
  );
}
