"use client";

import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { syncPaymentAccountAction } from "@/features/payment-account/actions";
import { useRouter } from "@/lib/navigation";
import { useToastAction } from "@/lib/use-toast-action";

/** Reads a payout account's status again, e.g. after returning from the provider's onboarding. */
export function RefreshProviderButton() {
  const t = useTranslations("integration.card");
  const router = useRouter();
  const { run, pending } = useToastAction();
  const refresh = () =>
    run({
      action: syncPaymentAccountAction,
      messages: { pending: t("refreshing"), success: t("refreshed") },
      onSuccess: () => router.refresh(),
    });
  return (
    <Button variant="outline" disabled={pending} onClick={refresh}>
      {t("refresh")}
    </Button>
  );
}
