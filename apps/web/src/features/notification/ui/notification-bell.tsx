"use client";

import { Button, Popover, PopoverContent, PopoverTrigger } from "@bibi/ui";
import { BellIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useNotificationLive } from "./notification-live-context";
import { NotificationPopover } from "./notification-popover";
import { UnreadDot } from "./unread-dot";
import { useLatestNotifications } from "./use-latest-notifications";

/**
 * The top bar's bell (ADR 0094): a red dot while anything is unread, kept live by the stream; it
 * opens the latest notifications, read when it opens.
 */
export function NotificationBell() {
  const t = useTranslations("notifications");
  const { unread } = useNotificationLive();
  const [open, setOpen] = useState(false);
  const latest = useLatestNotifications({ open });
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t("bell")}>
          <BellIcon />
          {unread > 0 ? (
            <UnreadDot
              label={t("unreadCount", { count: unread })}
              className="absolute top-2 right-2 ring-2 ring-background"
            />
          ) : null}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96 max-w-[calc(100vw-2rem)] p-0">
        <NotificationPopover latest={latest} unread={unread} onClose={() => setOpen(false)} />
      </PopoverContent>
    </Popover>
  );
}
