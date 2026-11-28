import { cn } from "../../lib/cn";
import { Avatar } from "../avatar/avatar";
import { TASK_ICON, taskTimeVariants } from "../task-look/task-look";
import { kanbanCardVariants } from "./kanban-card-variants";

export type KanbanTaskCardContentProps = {
  typeName: string;
  /** Null without a customer, or when the caller may not view customers: then none is shown. */
  customerName: string | null;
  /** Already formatted: "Thu 14:00", or the caller's word for no due time ("No due time"). */
  timeLabel: string;
  /** Past its due time: the time in red text, never a red fill. */
  overdue?: boolean;
  /** The main assignee's name, for the avatar; null without one. */
  assigneeName?: string | null;
};

/**
 * What a task card says (ADR 0121): the task icon and type, the customer, the due time (red when
 * overdue) and the assignee. The edge is the card's: an outline in the task colour, never filled
 * (`KanbanCard kind="task"`).
 */
export function KanbanTaskCardContent({
  typeName,
  customerName,
  timeLabel,
  overdue = false,
  assigneeName = null,
}: KanbanTaskCardContentProps) {
  const Icon = TASK_ICON;
  return (
    <div data-slot="kanban-task-card" className="grid min-w-0 gap-1.5">
      <p className="flex min-w-0 items-center gap-1.5 font-semibold text-foreground text-xs leading-snug">
        <Icon aria-hidden className="size-3.5 shrink-0 text-task" />
        <span className="truncate">{typeName}</span>
      </p>
      {customerName ? (
        <p className="truncate text-[11px] text-muted-foreground">{customerName}</p>
      ) : null}
      <div className="flex min-w-0 items-center gap-2 text-[11px]">
        <span className={cn(taskTimeVariants({ overdue }), "truncate")}>{timeLabel}</span>
        {assigneeName ? (
          <Avatar
            name={assigneeName}
            size="xs"
            className="ml-auto"
            title={assigneeName}
            aria-label={assigneeName}
          />
        ) : null}
      </div>
    </div>
  );
}

/** A task card outside a board (the assistant's board view): the same look, no drag. */
export function KanbanTaskCardStatic(props: KanbanTaskCardContentProps) {
  return (
    <div data-slot="kanban-task-card-static" className={kanbanCardVariants({ kind: "task" })}>
      <KanbanTaskCardContent {...props} />
    </div>
  );
}
