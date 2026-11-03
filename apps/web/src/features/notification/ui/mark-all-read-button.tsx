"use client";

import { Button } from "@bibi/ui";
import { CheckCheckIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/lib/navigation";
import { useMarkNotifications } from "./use-mark-notifications";

/** The page header's "Mark all as read"; the page reads again so every row moves to Read. */
export function MarkAllReadButton() {
  const t = useTranslations("notifications");
  const router = useRouter();
  const { markAllRead, pending } = useMarkNotifications({ onMarked: () => router.refresh() });
  return (
    <Button variant="outline" disabled={pending} onClick={markAllRead}>
      <CheckCheckIcon />
      {t("markAllRead")}
    </Button>
  );
}
