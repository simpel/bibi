"use client";

import { toast } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { ActionResult } from "@/lib/action-result";
import { sendTestInboxMessageAction, sendTestNotificationAction } from "../actions";

/**
 * Dev menu: sends a test notification or inbox message. No pending or sent toast: what arrives
 * shows its own toast through the stream (ADR 0094). Only a failure is toasted.
 */
export function useDevSend() {
  const t = useTranslations("dev");
  const send = async ({ action }: { action: () => Promise<ActionResult<unknown>> }) => {
    const result = await action().catch(() => null);
    if (result?.ok) return;
    const message = result?.error.message ?? "network";
    toast.error(t("sendFailed", { message }), {
      duration: Number.POSITIVE_INFINITY,
      closeButton: true,
    });
  };
  return {
    notification: () => void send({ action: sendTestNotificationAction }),
    inboxMessage: () => void send({ action: sendTestInboxMessageAction }),
  };
}
