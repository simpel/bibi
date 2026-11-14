"use client";

import type { NotificationDto } from "@bibi/core/schemas";
import { Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { NotificationRow } from "@/features/notification/ui/notification-row";
import { useMarkNotifications } from "@/features/notification/ui/use-mark-notifications";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

export type MyWorkChangesProps = { notifications: NotificationDto[]; unread: number };

/** What changed: the caller's latest unread notifications (ADR 0094, 0110). */
export function MyWorkChanges({ notifications, unread }: MyWorkChangesProps) {
  const t = useTranslations("myWork.changes");
  const { openOne } = useMarkNotifications();
  return (
    <Card data-slot="my-work-changes" className="shadow-none">
      <CardHeader className="flex flex-row items-baseline justify-between gap-2 p-4 pb-2">
        <CardTitle className="text-base">{t("title", { count: unread })}</CardTitle>
        <Link href={ROUTES.notifications} className="text-sm hover:underline">
          {t("all")}
        </Link>
      </CardHeader>
      <CardContent className="p-2 pt-0">
        {notifications.length === 0 ? (
          <p className="px-2 pb-2 text-sm text-muted-foreground">{t("empty")}</p>
        ) : (
          <div className="grid gap-0.5 md:grid-cols-2">
            {notifications.map((notification) => (
              <NotificationRow key={notification.id} notification={notification} onOpen={openOne} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
