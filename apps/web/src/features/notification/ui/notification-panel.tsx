"use client";

import { Sheet, SheetContent, SheetDescription, SheetTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useWideScreen } from "@/lib/use-wide-screen";
import { NotificationPanelBody } from "./notification-panel-body";
import { useNotificationPanel } from "./notification-panel-context";

/**
 * The notification panel on the right of the shell (spec: home), opened and closed with the
 * top bar's bell: beside the page on a wide screen, where it stays in view as the page scrolls,
 * and a sheet over it on a narrow one.
 */
export function NotificationPanel() {
  const t = useTranslations("notifications");
  const { open, setOpen } = useNotificationPanel();
  const wide = useWideScreen();
  if (wide) {
    if (!open) return null;
    return (
      <aside
        id="notification-panel"
        aria-label={t("title")}
        data-slot="notification-panel"
        className="sticky top-0 h-svh w-96 shrink-0 border-l bg-background"
      >
        <NotificationPanelBody closable />
      </aside>
    );
  }
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetContent id="notification-panel" side="right" className="w-full gap-0 p-0">
        <SheetTitle className="sr-only">{t("title")}</SheetTitle>
        <SheetDescription className="sr-only">{t("description")}</SheetDescription>
        <NotificationPanelBody closable={false} />
      </SheetContent>
    </Sheet>
  );
}
