import type { NotificationDto } from "@bibi/core/schemas";
import { Button } from "@bibi/ui";
import { MailCheckIcon, MailIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { useMarkNotifications } from "./use-mark-notifications";

type Mark = ReturnType<typeof useMarkNotifications>["mark"];
type BulkProps = { rows: NotificationDto[]; mark: Mark; onDelete: (ids: string[]) => void };

/** Mark the selected rows read or unread, or delete them (after a confirmation). */
export function BulkActions({ rows, mark, onDelete }: BulkProps) {
  const common = useTranslations("common");
  const ids = rows.map((row) => row.id);
  return (
    <>
      <Button size="sm" variant="outline" onClick={() => mark({ ids, read: true })}>
        <MailCheckIcon />
        {common("markRead")}
      </Button>
      <Button size="sm" variant="outline" onClick={() => mark({ ids, read: false })}>
        <MailIcon />
        {common("markUnread")}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="text-destructive"
        onClick={() => onDelete(ids)}
      >
        <Trash2Icon />
        {common("delete")}
      </Button>
    </>
  );
}

/** Shown when the list changed elsewhere; the rows stay put until the member asks. */
export function StaleBar({ onShow, pending }: { onShow: () => void; pending: boolean }) {
  const t = useTranslations("notifications");
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/50 px-3 py-2 text-sm">
      <span>{t("listChanged")}</span>
      <Button size="sm" variant="outline" disabled={pending} onClick={onShow}>
        <RefreshCwIcon />
        {t("showLatest")}
      </Button>
    </div>
  );
}
