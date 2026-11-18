import { cn, feedItemIconVariants, Shimmer } from "@bibi/ui";
import type { LucideIcon } from "lucide-react";

export type ActivityTitleCellProps = {
  title: string;
  unread: boolean;
  /** For screen readers next to the dot. */
  unreadLabel: string;
  /** A server action is changing it (marking it read on open): the title shimmers. */
  pending: boolean;
  onOpen: () => void;
  /** What it is about, in the same tinted circle as the bell's rows. */
  icon?: LucideIcon;
};

/**
 * The title of a notification or inbox row (ADR 0040): the unread dot when unread, the subject's
 * icon when given, then the title, which opens the item, bold while unread and shimmering while pending.
 */
export function ActivityTitleCell({
  title,
  unread,
  unreadLabel,
  pending,
  onOpen,
  icon: Icon,
}: ActivityTitleCellProps) {
  return (
    <div className="flex items-center gap-2">
      {unread ? (
        <span className="size-2 shrink-0 rounded-full bg-destructive">
          <span className="sr-only">{unreadLabel}</span>
        </span>
      ) : null}
      {Icon ? (
        <span className={cn(feedItemIconVariants(), "size-6", !unread && "opacity-70")}>
          <Icon aria-hidden />
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
