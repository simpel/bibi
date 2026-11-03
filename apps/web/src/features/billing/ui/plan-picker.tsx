"use client";

import type { BillingInterval } from "@bibi/core/schemas";
import { Badge, Button, ChoiceCard } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useToastAction } from "@/lib/use-toast-action";
import { startBillingCheckoutAction } from "../actions";

/** One plan as the server wrote it (prices in the user's money format). */
export type PlanOption = {
  interval: BillingInterval;
  title: string;
  price: string;
  note: string;
  badge: string | null;
};

export type PlanPickerProps = {
  plans: PlanOption[];
  /** The seat line: how many are included and what an extra one costs. */
  seats: string;
  /** Path in the organization to open after paying. */
  returnTo: string;
};

/** Monthly or yearly, then Stripe Checkout (ADR 0095): the browser leaves for Stripe's page. */
export function PlanPicker({ plans, seats, returnTo }: PlanPickerProps) {
  const t = useTranslations("billing.plans");
  const [interval, setInterval] = useState<BillingInterval>("MONTH");
  const { run, pending } = useToastAction();
  const pay = () =>
    run({
      action: () => startBillingCheckoutAction({ input: { interval, returnTo } }),
      messages: { pending: t("opening"), success: t("redirecting") },
      onSuccess: ({ value }) => {
        if (value.url) window.location.assign(value.url);
      },
    });
  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2">
        {plans.map((plan) => (
          <ChoiceCard
            key={plan.interval}
            title={plan.title}
            selected={plan.interval === interval}
            onClick={() => setInterval(plan.interval)}
            className="p-4"
          >
            <span className="text-lg font-medium">{plan.price}</span>
            <span className="text-xs text-muted-foreground">{t("exclVat")}</span>
            <span className="text-muted-foreground">{plan.note}</span>
            {plan.badge ? <Badge variant="success">{plan.badge}</Badge> : null}
          </ChoiceCard>
        ))}
      </div>
      <p className="text-sm text-muted-foreground">{seats}</p>
      <Button type="button" disabled={pending} onClick={pay}>
        {t("continue")}
      </Button>
    </div>
  );
}
