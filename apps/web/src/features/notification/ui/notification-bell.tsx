"use client";

import type { NotificationDto } from "@bibi/core/schemas";
import { Button, Popover, PopoverContent, PopoverTrigger } from "@bibi/ui";
import { BellIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import { NotificationPopover } from "./notification-popover";
import { UnreadDot } from "./unread-dot";
import { useNotificationStream } from "./use-notification-stream";

export type NotificationBellProps = {
  /** The caller's unread count and latest notifications, rendered on the server. */
  unread: number;
  latest: NotificationDto[];
  /** The page's organization; the stream refuses another one's count. */
  organizationId: string;
};

/**
 * The top bar's bell (ADR 0094): a red dot while anything is unread, kept live by the stream; it
 * opens the latest notifications. A change while the popover or the list is open re-renders them.
 */
export function NotificationBell({
  unread: initial,
  latest,
  organizationId,
}: NotificationBellProps) {
  const t = useTranslations("notifications");
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { unread, changes } = useNotificationStream({ initial, organizationId });
  const [shown, setShown] = useState(0);
  // The first message is the count on connect; later ones mean the rows the server rendered moved on.
  useEffect(() => {
    if (changes <= Math.max(shown, 1) || !(open || pathname === ROUTES.notifications)) return;
    setShown(changes);
    router.refresh();
  }, [changes, shown, open, pathname, router]);
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
