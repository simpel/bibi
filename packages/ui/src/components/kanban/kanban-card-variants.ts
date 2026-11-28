import { cva } from "class-variance-authority";
import { TASK_EDGE } from "../task-look/task-look";

/**
 * An order card is a filled card with a shadow; a task card is never filled, a hairline in the
 * task colour (`TASK_EDGE`), so a task is never mistaken for an order (ADR 0120).
 */
export const kanbanCardVariants = cva("min-w-0 rounded-xl p-3 text-card-foreground outline-none", {
  variants: {
    kind: { order: "border bg-card shadow-sm", task: TASK_EDGE },
  },
  defaultVariants: { kind: "order" },
});
