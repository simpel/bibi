import { cn, Shimmer } from "@bibi/ui";

export type ActivityTitleCellProps = {
  title: string;
  unread: boolean;
  /** For screen readers next to the dot. */
  unreadLabel: string;
  /** A server action is changing it (marking it read on open): the title shimmers. */
  pending: boolean;
  onOpen: () => void;
};

/**
 * The title of a notification or inbox row (ADR 0040): the unread dot when unread, then the
 * title, which opens the item, bold while unread and shimmering while pending.
 */
export function ActivityTitleCell({
  title,
  unread,
  unreadLabel,
  pending,
  onOpen,
}: ActivityTitleCellProps) {
  return (
    <div className="flex items-center gap-2">
      {unread ? (
        <span className="size-2 shrink-0 rounded-full bg-destructive">
          <span className="sr-only">{unreadLabel}</span>
        </span>
      ) : null}
      {pending ? (
        <Shimmer className="truncate font-medium text-foreground">{title}</Shimmer>
      ) : (
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onOpen();
          }}
          className={cn("truncate text-left hover:underline", unread && "font-medium")}
        >
          {title}
        </button>
      )}
    </div>
  );
}
