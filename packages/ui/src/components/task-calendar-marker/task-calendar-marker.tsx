import { cva, type VariantProps } from "class-variance-authority";
import type { CSSProperties } from "react";
import { cn } from "../../lib/cn";
import { AppLink } from "../app-link/app-link";
import { TASK_ICON, taskTimeVariants, taskTitleVariants } from "../task-look/task-look";

/**
 * A task is a point at its due time (ADR 0120): a hairline tick in the task colour at its left
 * edge with the icon beside it. Never filled, unlike a booking beside it.
 */
export const taskCalendarMarkerVariants = cva(
  "@container flex min-w-0 items-center gap-1 overflow-hidden border-0 border-l border-solid border-task pr-1 pl-1 text-xs outline-none",
  {
    variants: {
      /** Only the outline, no words: a task's echo on an asset's row, behind nothing. */
      bare: { true: "pointer-events-none", false: "" },
      done: { true: "opacity-60", false: "" },
      linked: {
        true: "cursor-pointer hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring",
        false: "",
      },
    },
    defaultVariants: { bare: false, done: false, linked: false },
  },
);

export type TaskCalendarMarkerProps = Pick<
  VariantProps<typeof taskCalendarMarkerVariants>,
  "bare"
> & {
  /** The task's title. */
  label: string;
  /** Already formatted: "14:00". */
  timeLabel: string;
  done?: boolean;
  /** Past its time and not done: the time in red text. */
  overdue?: boolean;
  /** An app path: the marker links there. */
  href?: string | undefined;
  onClick?: (() => void) | undefined;
  /** Placement by the caller, e.g. absolute with `left`/`width` from the track. */
  className?: string;
  style?: CSSProperties;
};

/** A task on the calendar, outlined and unfilled; the caller places it on its track. */
export function TaskCalendarMarker({
  label,
  timeLabel,
  done = false,
  overdue = false,
  href,
  onClick,
  bare = false,
  className,
  style,
}: TaskCalendarMarkerProps) {
  const Icon = TASK_ICON;
  const name = `${timeLabel} · ${label}`;
  const linked = !bare && Boolean(href || onClick);
  const classes = cn(taskCalendarMarkerVariants({ bare, done, linked }), className);
  const body = bare ? null : (
    <>
      <Icon aria-hidden className="size-3 shrink-0 text-task @max-[1.25rem]:hidden" />
      <span className={cn(taskTimeVariants({ overdue, done }), "@max-[4.5rem]:hidden")}>
        {timeLabel}
      </span>
      <span className={cn(taskTitleVariants({ done }), "@max-[2.5rem]:hidden")}>{label}</span>
    </>
  );
  const common = { "data-slot": "task-calendar-marker", className: classes, style };
  if (bare) return <span aria-hidden {...common} />;
  if (href) {
    return (
      <AppLink href={href} onClick={onClick} title={name} aria-label={name} {...common}>
        {body}
      </AppLink>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} title={name} aria-label={name} {...common}>
        {body}
      </button>
    );
  }
  return (
    <span role="img" title={name} aria-label={name} {...common}>
      {body}
    </span>
  );
}
