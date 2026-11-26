import type { NextTask } from "@bibi/core/schemas";
import { TaskChip } from "@bibi/ui";
import { taskTimeLabel } from "@/features/task/lib/task-time-label";
import { taskRoute } from "@/lib/routes";
import { useDateTimeFormat } from "@/lib/time/use-date-time-format";

type Wireish = Omit<NonNullable<NextTask>, "dueAt"> & { dueAt: Date | string };

export type NextTaskChipProps = { task: Wireish; className?: string };

/**
 * An order's next open task (ADR 0117, 0120: it has a due time) as an outlined chip that opens the task. A click on it
 * stays on the chip, so it never also opens the order card or row it sits in.
 */
export function NextTaskChip({ task, className }: NextTaskChipProps) {
  const dates = useDateTimeFormat();
  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: only keeps the card or row click from firing; the chip's link handles the keyboard
    // biome-ignore lint/a11y/useKeyWithClickEvents: same wrapper, no action of its own
    <span className={className} onClick={(event) => event.stopPropagation()}>
      <TaskChip
        size="sm"
        timeLabel={taskTimeLabel({ task, dates })}
        title={task.typeName}
        overdue={task.overdue}
        href={taskRoute({ id: task.id })}
      />
    </span>
  );
}
