"use client";

import { Button } from "@bibi/ui";
import { BellIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useNotificationLive } from "./notification-live-context";
import { useNotificationPanel } from "./notification-panel-context";
import { UnreadDot } from "./unread-dot";
import { useBumpOnRise } from "./use-bump-on-rise";

/**
 * The top bar's bell (ADR 0094): a red dot while anything is unread, kept live by the stream, and a
 * wiggle when a new one comes in; it opens and closes the notification panel on the right.
 */
export function NotificationBell() {
  const t = useTranslations("notifications");
  const { unread } = useNotificationLive();
  const { open, setOpen } = useNotificationPanel();
  // A new key replays the wiggle each time a notification comes in.
  const wiggles = useBumpOnRise({ value: unread });
  return (
    <Button
      variant={open ? "secondary" : "ghost"}
      size="icon"
      className="relative"
      aria-label={t("bell")}
      aria-expanded={open}
      aria-controls="notification-panel"
      onClick={() => setOpen(!open)}
    >
      <BellIcon
        key={wiggles}
        className={wiggles > 0 ? "origin-top motion-safe:animate-wiggle" : undefined}
      />
      {unread > 0 ? (
        <UnreadDot
          label={t("unreadCount", { count: unread })}
          className="absolute top-2 right-2 ring-2 ring-background"
        />
      ) : null}
    </Button>
  );
}
