"use client";

import { Button, Spinner } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useEffect, useRef, useState } from "react";
import { Link, useRouter } from "@/lib/navigation";
import { syncBillingAction } from "../actions";

export type FinishPaymentProps = { returnTo: string };

type Phase = "syncing" | "paid" | "paidInTrial";

/**
 * Checkout's success page: reads the subscription back from Stripe once (the webhook may not
 * have arrived yet), then thanks the payer with a way on to `returnTo`. If the organization is
 * still closed, it opens `returnTo` at once and the gate shows the payment page.
 */
export function FinishPayment({ returnTo }: FinishPaymentProps) {
  const t = useTranslations("billing.done");
  const router = useRouter();
  const started = useRef(false);
  const [phase, setPhase] = useState<Phase>("syncing");
  // Syncs once with Stripe (the payment provider) when the payer lands back from Checkout.
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    void syncBillingAction().then(
      (result) => {
        if (!result.ok || !result.value.access.open) return router.replace(returnTo);
        setPhase(result.value.access.state === "TRIAL" ? "paidInTrial" : "paid");
      },
      () => router.replace(returnTo),
    );
  }, [router, returnTo]);
  if (phase === "syncing")
    return (
      <p className="flex items-center justify-center gap-2 text-muted-foreground">
        <Spinner label={t("finishing")} />
        <span aria-hidden>{t("finishing")}</span>
      </p>
    );
  return (
    <div className="grid justify-items-center gap-6 text-center">
      <p className="text-muted-foreground">{t(phase)}</p>
      <Button asChild>
        <Link href={returnTo}>{t("continue")}</Link>
      </Button>
    </div>
  );
}
