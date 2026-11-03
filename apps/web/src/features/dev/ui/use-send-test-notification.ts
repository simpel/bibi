"use client";

import { useTranslations } from "next-intl";
import { useToastAction } from "@/lib/use-toast-action";
import { sendTestNotificationAction } from "../actions";

/**
 * Dev menu: sends the signed-in member a test notification (ADR 0094). The stream brings it to
 * the bell, so nothing renders again.
 */
export function useSendTestNotification() {
  const t = useTranslations("dev");
  const { run } = useToastAction();
  return () =>
    run({
      action: sendTestNotificationAction,
      messages: { pending: t("sendingNotification"), success: t("notificationSent") },
    });
}
