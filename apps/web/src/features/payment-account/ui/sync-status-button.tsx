"use client";

import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";
import { syncPaymentAccountAction } from "../actions";

/** Pulls the account's status from Stripe, e.g. after returning from onboarding. */
export function SyncStatusButton() {
  const t = useTranslations("paymentAccount");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const sync = () =>
    run({
      action: syncPaymentAccountAction,
      messages: { pending: t("refreshing"), success: t("refreshed") },
      onSuccess: () => router.refresh(),
    });
  return (
    <Button variant="outline" disabled={pending} onClick={sync}>
      {t("refresh")}
    </Button>
  );
}
