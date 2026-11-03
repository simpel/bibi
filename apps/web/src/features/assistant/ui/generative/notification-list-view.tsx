"use client";

import { Card } from "@bibi/ui";
import { NotificationRow } from "@/features/notification/ui/notification-row";
import { useMarkNotifications } from "@/features/notification/ui/use-mark-notifications";
import type { GenerativeProps } from "./generative-props";
import { MoreHint } from "./more-hint";

export type NotificationListViewProps = GenerativeProps<"notification-list">;

/** The caller's notifications as the assistant listed them (ADR 0094); opening one marks it read. */
export function NotificationListView({ items, nextCursor }: NotificationListViewProps) {
  const { openOne } = useMarkNotifications();
  return (
    <Card data-slot="notification-list" className="gap-0.5 p-1 shadow-none">
      {items.map((notification) => (
        <NotificationRow key={notification.id} notification={notification} onOpen={openOne} />
      ))}
      <MoreHint nextCursor={nextCursor} />
    </Card>
  );
}
