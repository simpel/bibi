"use client";

import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useToastAction } from "@/lib/use-toast-action";
import { remindBillingAdminsAction } from "../actions";

/** The one thing a member who cannot pay can do (ADR 0095 §7): mail the admins a reminder. */
export function RemindAdminButton() {
  const t = useTranslations("billing.pay");
  const { run, pending } = useToastAction();
  const remind = () =>
    run({
      action: remindBillingAdminsAction,
      messages: {
        pending: t("reminding"),
        success: ({ value }) => (value.sent ? t("reminded") : t("alreadyReminded")),
      },
    });
  return (
    <Button type="button" className="w-full" disabled={pending} onClick={remind}>
      {t("remind")}
    </Button>
  );
}
