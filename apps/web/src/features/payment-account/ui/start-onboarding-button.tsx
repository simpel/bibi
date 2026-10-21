"use client";

import { Button } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useToastAction } from "@/lib/use-toast-action";
import { startPaymentOnboardingAction } from "../actions";

export type StartOnboardingButtonProps = { connected: boolean };

/** Creates the connected account on first use, then sends the browser to Stripe's onboarding. */
export function StartOnboardingButton({ connected }: StartOnboardingButtonProps) {
  const t = useTranslations("paymentAccount");
  const { run, pending } = useToastAction();
  const start = () =>
    run({
      action: startPaymentOnboardingAction,
      messages: { pending: t("starting"), success: t("redirecting") },
      onSuccess: ({ value }) => {
        if (value.onboardingUrl) window.location.assign(value.onboardingUrl);
      },
    });
  return (
    <Button disabled={pending} onClick={start}>
      {connected ? t("continueOnboarding") : t("connect")}
    </Button>
  );
}
