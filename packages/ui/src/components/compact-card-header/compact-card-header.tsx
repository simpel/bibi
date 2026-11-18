import type { ReactNode } from "react";
import { cn } from "../../lib/cn";

export type CompactCardHeaderProps = {
  title: ReactNode;
  /** One muted line under the title, e.g. the customer and value. */
  subtitle?: ReactNode;
  /** Icon buttons top right; each card brings its own (pinned: expand and close, pipeline: open). */
  actions?: ReactNode;
  /** Room kept for the actions on the right of the title; widen it for more or wider actions. */
  actionsInset?: string;
  className?: string;
};

/**
 * The small card's header, shared by the minimized pinned card and the pipeline card: a bold
 * title on one line, one muted line under it and the card's own icon actions top right.
 */
export function CompactCardHeader({
  title,
  subtitle,
  actions,
  actionsInset = "pr-16",
  className,
}: CompactCardHeaderProps) {
  return (
    <div data-slot="compact-card-header" className={cn("relative min-h-7 min-w-0", className)}>
      <div className={cn("min-w-0", actions && actionsInset)}>
        <p className="truncate font-semibold text-foreground text-xs leading-snug">{title}</p>
        {subtitle ? (
          <p className="mt-0.5 truncate text-[11px] text-muted-foreground">{subtitle}</p>
        ) : null}
      </div>
      {actions ? (
        <div className="absolute top-0 right-0 flex items-center gap-1">{actions}</div>
      ) : null}
    </div>
  );
}
