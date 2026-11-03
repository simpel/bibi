import { cn, Shimmer } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { ChannelIcon } from "./channel-icon";
import type { InboxRow } from "./inbox-row";

export type InboxTitleCellProps = {
  row: InboxRow;
  /** Being marked read before its sheet opens: the subject shimmers. */
  pending: boolean;
  onSelect: (input: { row: InboxRow }) => void;
};

/**
 * Inbox style: the unread dot, the channel's icon, then the sender in small type over the
 * subject, which opens the message's sheet.
 */
export function InboxTitleCell({ row, pending, onSelect }: InboxTitleCellProps) {
  const t = useTranslations("inbox");
  const subject = row.subject ?? t("noSubject");
  return (
    <div className="flex items-center gap-3">
      <span className="w-2 shrink-0">
        {row.read ? null : (
          <span className="block size-2 rounded-full bg-destructive">
            <span className="sr-only">{t("unread")}</span>
          </span>
        )}
      </span>
      <ChannelIcon channel={row.channel} />
      <div className="grid min-w-0 gap-0.5">
        <span className="truncate text-xs text-muted-foreground">
          {row.sender ?? t("unknownSender")}
        </span>
        {pending ? (
          <Shimmer className="truncate font-medium">{subject}</Shimmer>
        ) : (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onSelect({ row });
            }}
            className={cn("truncate text-left hover:underline", !row.read && "font-medium")}
          >
            {subject}
          </button>
        )}
      </div>
    </div>
  );
}
