"use client";

import { Spinner } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useEffect, useRef } from "react";
import { useRouter } from "@/lib/navigation";
import { syncBillingAction } from "../actions";

export type FinishPaymentProps = { returnTo: string };

/**
 * Checkout's success page: reads the subscription back from Stripe once (the webhook may not
 * have arrived yet), then opens `returnTo`. If it still is unpaid, the gate shows the payment page.
 */
export function FinishPayment({ returnTo }: FinishPaymentProps) {
  const t = useTranslations("billing.done");
  const router = useRouter();
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void syncBillingAction().finally(() => router.replace(returnTo));
  }, [router, returnTo]);
  return (
    <p className="flex items-center justify-center gap-2 text-muted-foreground">
      <Spinner label={t("finishing")} />
      <span aria-hidden>{t("finishing")}</span>
    </p>
  );
}
