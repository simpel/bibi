import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "../../lib/cn";
import { AppLink } from "../app-link/app-link";
import {
  TASK_EDGE,
  TASK_ICONS,
  type TaskShape,
  taskTimeVariants,
  taskTitleVariants,
} from "../task-shape/task-shape";

export const taskChipVariants = cva(
  cn(
    TASK_EDGE,
    "inline-flex w-fit max-w-full min-w-0 items-center gap-1.5 rounded-md text-xs [&>svg]:size-3 [&>svg]:shrink-0 [&>svg]:text-task",
  ),
  {
    variants: {
      size: { default: "px-2 py-0.5", sm: "px-1.5 py-px" },
      /** Opens the task: a faint ground on hover and the focus ring. */
      linked: {
        true: "outline-none hover:bg-accent/40 focus-visible:ring-2 focus-visible:ring-ring",
        false: "",
      },
    },
    defaultVariants: { size: "default", linked: false },
  },
);

export type TaskChipProps = Omit<ComponentProps<"span">, "title"> &
  Pick<VariantProps<typeof taskChipVariants>, "size"> & {
    shape: TaskShape;
    /** Already formatted: "Thu 14:00". */
    timeLabel: string;
    title: string;
    /** Past its time and not done: the time in red text, never a red fill. */
    overdue?: boolean;
    done?: boolean;
    /** An app path: the chip links there. */
    href?: string;
  };

/**
 * An order card's next step in one line: the shape's icon, the time, the title. Outlined in the
 * task colour, never filled, so it never reads as part of the order's own colour.
 */
export function TaskChip({
  shape,
  timeLabel,
  title,
  overdue = false,
  done = false,
  href,
  size,
  className,
  ...props
}: TaskChipProps) {
  const Icon = TASK_ICONS[shape];
  const body = (
    <>
      <Icon aria-hidden />
      <span className={taskTimeVariants({ overdue, done })}>{timeLabel}</span>
      <span aria-hidden className="text-muted-foreground">
        ·
      </span>
      <span className={taskTitleVariants({ done })}>{title}</span>
    </>
  );
  const classes = cn(taskChipVariants({ size, linked: Boolean(href) }), className);
  if (href) {
    return (
      <AppLink href={href} data-slot="task-chip" className={classes}>
        {body}
      </AppLink>
    );
  }
  return (
    <span data-slot="task-chip" className={classes} {...props}>
      {body}
    </span>
  );
}
