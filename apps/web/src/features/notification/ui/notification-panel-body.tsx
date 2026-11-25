import { Button, cn, Separator } from "@bibi/ui";
import { SettingsIcon, XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { filterTasks } from "@/features/my-work/lib/filter-tasks";
import { DismissTaskButton } from "@/features/my-work/ui/dismiss-task-button";
import { NeedsYou } from "@/features/my-work/ui/needs-you";
import { Link } from "@/lib/navigation";
import { useNumberFormat } from "@/lib/number/use-number-format";
import { ROUTES } from "@/lib/routes";
import { NotificationFeed } from "./notification-feed";
import { useNotificationLive } from "./notification-live-context";
import { useNotificationPanel } from "./notification-panel-context";
import { NotificationPanelSearch } from "./notification-panel-search";
import { useMarkNotifications } from "./use-mark-notifications";
import { useNotificationQuery } from "./use-notification-query";

export type NotificationPanelBodyProps = {
  /** The panel's own close button; a sheet brings its own. */
  closable: boolean;
};

/**
 * The panel's content: a header with Mark all as read, one search for both lists (free text, and `type:` for notifications), then Needs you
 * on top (what the member must act on, always first) and the unread notifications under it, read
 * on as they scroll. Each row has a checkmark on hover: dismiss a task (after a confirm), mark a
 * notification read; either stays greyed out until the next page. The search narrows Needs you
 * here and the notifications on the server.
 */
export function NotificationPanelBody({ closable }: NotificationPanelBodyProps) {
  const t = useTranslations("notifications");
  const { tasks, setOpen, dimmed, markDismissed } = useNotificationPanel();
  const { unread } = useNotificationLive();
  const { markAllRead, openOne, pending } = useMarkNotifications();
  const numbers = useNumberFormat();
  const [query, setQuery] = useState("");
  const searchQuery = useNotificationQuery();
  const { text, kind } = searchQuery.split({ q: query });
  const scroller = useRef<HTMLDivElement>(null);
  return (
    <div data-slot="notification-panel-body" className="flex h-full min-h-0 flex-col">
      <header
        className={cn("flex h-14 shrink-0 items-center gap-2 border-b px-4", !closable && "pr-12")}
      >
        <h2 className="min-w-0 flex-1 truncate font-medium">{t("title")}</h2>
        <Button variant="ghost" size="sm" disabled={unread === 0 || pending} onClick={markAllRead}>
          {t("markAllRead")}
        </Button>
        <Button variant="ghost" size="icon" aria-label={t("panel.settings")} asChild>
          <Link href={`${ROUTES.profile}#notifications`} onClick={() => setOpen(false)}>
            <SettingsIcon />
          </Link>
        </Button>
        {closable ? (
          <Button
            variant="ghost"
            size="icon"
            aria-label={t("panel.close")}
            onClick={() => setOpen(false)}
          >
            <XIcon />
          </Button>
        ) : null}
      </header>
      <NotificationPanelSearch value={query} onChange={setQuery} query={searchQuery} />
      <div ref={scroller} className="grid min-h-0 flex-1 content-start gap-2 overflow-y-auto p-1">
        {tasks && !kind ? (
          <>
            <NeedsYou
              tasks={filterTasks({ tasks, query: text })}
              numbers={numbers}
              empty={text.trim() ? t("panel.noTasks") : undefined}
              dimmed={dimmed}
              action={({ task }) => (
                <DismissTaskButton taskKey={task.key} onDismissed={markDismissed} />
              )}
            />
            <Separator className="my-1" />
          </>
        ) : null}
        <NotificationFeed query={text} kind={kind} root={scroller} onOpen={openOne} />
      </div>
    </div>
  );
}
