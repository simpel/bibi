import { cva } from "class-variance-authority";
import { ClipboardCheckIcon } from "lucide-react";

/** The one icon of a task, the same wherever a task shows. A task has no shape (ADR 0120). */
export const TASK_ICON = ClipboardCheckIcon;

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
