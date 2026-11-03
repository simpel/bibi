"use client";

import { Button } from "@bibi/ui";
import { CheckCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useMarkNotifications } from "./use-mark-notifications";

/** The page header's "Mark all as read". */
export function MarkAllReadButton() {
  const t = useTranslations("notifications");
  const { markAllRead, pending } = useMarkNotifications();
  return (
    <Button variant="outline" disabled={pending} onClick={markAllRead}>
      <CheckCheckIcon />
      {t("markAllRead")}
    </Button>
  );
}
