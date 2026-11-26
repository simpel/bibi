import { cva, type VariantProps } from "class-variance-authority";
import { CheckIcon } from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "../../lib/cn";
import { AppLink } from "../app-link/app-link";
import { Button } from "../button/button";
import { TASK_EDGE, TASK_ICON, taskTimeVariants, taskTitleVariants } from "../task-look/task-look";

export const taskRowVariants = cva(
  cn(
    TASK_EDGE,
    "relative grid grid-cols-[auto_auto_minmax(0,1fr)_auto] items-start gap-x-2.5 rounded-md text-sm",
  ),
  {
    variants: {
      size: { default: "px-3 py-2", compact: "px-2 py-1.5" },
      /** Done: the row is muted, its words struck through. */
      done: { true: "text-muted-foreground", false: "" },
      /** The whole row opens the task. */
      linked: { true: "hover:bg-accent/40 focus-within:bg-accent/40", false: "" },
    },
    defaultVariants: { size: "default", done: false, linked: false },
  },
);

export type TaskCheckboxProps = {
  checked: boolean;
  onCheckedChange?: ((checked: boolean) => void) | undefined;
  disabled?: boolean | undefined;
  /** What a click does, e.g. "Mark Site visit as done". */
  label: string;
  className?: string;
};

/**
 * The task's done toggle: a ghost icon button with a check, like the checkmark on a Needs you
 * row. Open: a faint check that firms up on hover; done: the check in the task colour. The
 * label says what a click does now and is the button's tooltip.
 */
export function TaskCheckbox({
  checked,
  onCheckedChange,
  disabled,
  label,
  className,
}: TaskCheckboxProps) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      aria-label={label}
      aria-pressed={checked}
      disabled={disabled}
      onClick={() => onCheckedChange?.(!checked)}
      className={cn(
        "relative z-10 -my-1 size-7",
        checked ? "text-task" : "text-muted-foreground/50 hover:text-foreground",
        className,
      )}
    >
      <CheckIcon />
    </Button>
  );
}

export type TaskRowProps = Omit<ComponentProps<"div">, "title"> &
  Pick<VariantProps<typeof taskRowVariants>, "size"> & {
    /** Already formatted on the server, time first: "Thu 14:00", or a word for no time. */
    timeLabel: string;
    title: ReactNode;
    /** One muted line under it, e.g. "Volvo Cars · Sara". */
    meta?: ReactNode;
    /** Done: checked, struck through and muted. */
    checked?: boolean;
    /** Past its time and not done: the time in red text. */
    overdue?: boolean;
    onCheckedChange?: (checked: boolean) => void;
    disabled?: boolean;
    /** The checkbox's accessible name: what a click does now. */
    checkboxLabel: string;
    /** An app path; the title links there and the whole row opens it. */
    href?: string;
    onOpen?: () => void;
    /** At the end of the row, e.g. an avatar or a menu. Sits above the row's link. */
    trailing?: ReactNode;
  };

/**
 * One task in a list (tasks, an order's or customer's tasks, My work): round checkbox, the
 * task icon, the time first, then the title. No fill: a hairline in the task colour.
 */
export function TaskRow({
  timeLabel,
  title,
  meta,
  checked = false,
  overdue = false,
  onCheckedChange,
  disabled,
  checkboxLabel,
  href,
  onOpen,
  trailing,
  size,
  className,
  ...props
}: TaskRowProps) {
  const Icon = TASK_ICON;
  const heading = (
    <span className="flex min-w-0 items-baseline gap-1.5">
      <span className={taskTimeVariants({ overdue, done: checked })}>{timeLabel}</span>
      <span aria-hidden className="text-muted-foreground">
        ·
      </span>
      <span className={taskTitleVariants({ done: checked })}>{title}</span>
    </span>
  );
  return (
    <div
      data-slot="task-row"
      data-done={checked || undefined}
      data-overdue={overdue || undefined}
      className={cn(taskRowVariants({ size, done: checked, linked: Boolean(href) }), className)}
      {...props}
    >
      <TaskCheckbox
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
        label={checkboxLabel}
      />
      <Icon aria-hidden className={cn("mt-0.5 size-4 text-task", checked && "opacity-60")} />
      <span className="grid min-w-0 gap-0.5">
        {href ? (
          <AppLink
            href={href}
            onClick={onOpen}
            className="min-w-0 outline-none after:absolute after:inset-0 after:rounded-md focus-visible:after:ring-2 focus-visible:after:ring-ring"
          >
            {heading}
          </AppLink>
        ) : (
          heading
        )}
        {meta ? (
          <span className="flex min-w-0 gap-1.5 truncate text-xs text-muted-foreground">
            {meta}
          </span>
        ) : null}
      </span>
      {trailing ? <span className="relative z-10 flex items-center">{trailing}</span> : <span />}
    </div>
  );
}
