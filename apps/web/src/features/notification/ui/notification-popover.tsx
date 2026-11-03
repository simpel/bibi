import type { NotificationDto } from "@bibi/core/schemas";
import { Button, PopoverHeader, PopoverTitle, Separator } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import type { NotificationLike } from "../lib/notification-like";
import { NotificationRow } from "./notification-row";
import { useMarkNotifications } from "./use-mark-notifications";

export type NotificationPopoverProps = {
  latest: NotificationDto[];
  unread: number;
  onClose: () => void;
};

/** The bell's popover: mark all read, the latest notifications, and a link to all of them. */
export function NotificationPopover({ latest, unread, onClose }: NotificationPopoverProps) {
  const t = useTranslations("notifications");
  const { markAllRead, openOne, pending } = useMarkNotifications();
  const open = ({ notification }: { notification: NotificationLike }) => {
    openOne({ notification });
    onClose();
  };
  return (
    <div className="grid">
      <PopoverHeader className="flex flex-row items-center justify-between gap-2 px-4 py-3">
        <PopoverTitle>{t("latest")}</PopoverTitle>
        <Button variant="ghost" size="sm" disabled={unread === 0 || pending} onClick={markAllRead}>
          {t("markAllRead")}
        </Button>
      </PopoverHeader>
      <Separator />
      {latest.length === 0 ? (
        <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t("nothingNew")}</p>
      ) : (
        <div className="grid max-h-96 gap-0.5 overflow-y-auto p-1">
          {latest.map((notification) => (
            <NotificationRow key={notification.id} notification={notification} onOpen={open} />
          ))}
        </div>
      )}
      <Separator />
      <Button asChild variant="ghost" className="rounded-t-none">
        <Link href={ROUTES.notifications} onClick={onClose}>
          {t("seeAll")}
        </Link>
      </Button>
    </div>
  );
}
