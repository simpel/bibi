import { cva, type VariantProps } from "class-variance-authority";
import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "../../lib/cn";
import { AppLink } from "../app-link/app-link";

export const feedItemIconVariants = cva(
  "flex size-7 shrink-0 items-center justify-center rounded-full [&>svg]:size-3.5",
  {
    variants: {
      tone: {
        default: "bg-muted text-muted-foreground",
        warning: "bg-warning/15 text-warning-foreground",
        destructive: "bg-destructive/10 text-destructive",
      },
    },
    defaultVariants: { tone: "default" },
  },
);

export type FeedItemProps = VariantProps<typeof feedItemIconVariants> & {
  /** What it is about (a payment, a run sheet, a message): the same icon wherever it shows. */
  icon: LucideIcon;
  /** An app path; the whole row opens it. */
  href: string;
  /** What happened or what to do, as one sentence. */
  title: ReactNode;
  /** The order it belongs to and when, on one muted line. */
  meta?: ReactNode;
  /** Something to act on or not yet read: the title is bold. */
  emphasis?: boolean;
  /** Already dealt with (read): the row is muted. */
  muted?: boolean;
  /** At the end of the title line, e.g. the unread dot. */
  marker?: ReactNode;
  /**
   * A small icon button over the end of the row (e.g. dismiss), shown on hover or keyboard focus,
   * and always on a touch screen. It sits outside the link, so it never opens the row.
   */
  action?: ReactNode;
  onClick?: () => void;
  className?: string;
};

/**
 * One row of a feed, the shape a notification and a task share: the subject's icon in a tinted
 * circle, a one-line title, a muted line under it, and an optional marker. The whole row links.
 */
export function FeedItem({
  icon: Icon,
  href,
  title,
  meta,
  emphasis = false,
  muted = false,
  marker,
  tone,
  onClick,
  action,
  className,
}: FeedItemProps) {
  const link = (
    <AppLink
      href={href}
      onClick={onClick}
      data-slot="feed-item"
      className={cn(
        "grid grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 rounded-md px-3 py-2 text-sm hover:bg-accent focus-visible:bg-accent focus-visible:outline-none",
        muted && "text-muted-foreground",
        className,
      )}
    >
      <span className={cn(feedItemIconVariants({ tone }), muted && "opacity-70")}>
        <Icon aria-hidden />
      </span>
      <span className="grid min-w-0 gap-0.5">
        <span className={cn("truncate", emphasis && "font-medium")}>{title}</span>
        {meta ? (
          <span className="flex min-w-0 gap-1.5 text-xs text-muted-foreground">{meta}</span>
        ) : null}
      </span>
      <span className="pt-1.5">{marker}</span>
    </AppLink>
  );
  if (!action) return link;
  return (
    <div data-slot="feed-item-with-action" className="group/feed-item relative">
      {link}
      <div className="absolute top-1.5 right-1.5 opacity-0 transition-opacity group-hover/feed-item:opacity-100 focus-within:opacity-100 [@media(hover:none)]:opacity-100">
        {action}
      </div>
    </div>
  );
}
