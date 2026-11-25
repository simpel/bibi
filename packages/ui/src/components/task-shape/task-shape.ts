import { cva } from "class-variance-authority";
import { CalendarClockIcon, FlagIcon, type LucideIcon } from "lucide-react";

/** A task is a meeting (it takes time) or a deadline (a point in time). Spec: tasks. */
export type TaskShape = "meeting" | "deadline";

/** The fixed icon of each shape, the same wherever a task shows. */
export const TASK_ICONS: Record<TaskShape, LucideIcon> = {
  meeting: CalendarClockIcon,
  deadline: FlagIcon,
};

/**
 * A task's surface: never filled, a solid hairline in the task colour. Dashed is taken: it means
 * blocked or preliminary on a booking (`booking-tone`).
 */
export const TASK_EDGE = "border border-solid border-task bg-transparent";

/** The time a task leads with: red text when overdue (never a red fill), muted once done. */
export const taskTimeVariants = cva("shrink-0 tabular-nums", {
  variants: {
    overdue: { true: "font-medium text-destructive", false: "" },
    done: { true: "text-muted-foreground", false: "" },
  },
  compoundVariants: [{ overdue: true, done: true, className: "font-normal text-muted-foreground" }],
  defaultVariants: { overdue: false, done: false },
});

/** A done task's words: struck through and muted. */
export const taskTitleVariants = cva("min-w-0 truncate", {
  variants: { done: { true: "text-muted-foreground line-through", false: "" } },
  defaultVariants: { done: false },
});
