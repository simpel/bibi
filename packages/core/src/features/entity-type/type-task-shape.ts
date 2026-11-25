import { ok, type Result } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict, invalid } from "../../shared/errors";
import type { TaskShape } from "../task/task-shape";
import type { EntityBase } from "./capability-kinds";

const path = "taskShape";

export type CheckNewTaskShapeInput = { base: EntityBase; taskShape: TaskShape | undefined };

/** A task type is created with a shape (ADR 0117); no other base has one. */
export function checkNewTaskShape({ base, taskShape }: CheckNewTaskShapeInput): Result<true> {
  if (base === "TASK" && !taskShape) {
    const message = "A task type needs a shape: MEETING or DEADLINE";
    return invalid({ message, issues: [{ path, message }] });
  }
  return checkShapeBase({ base, taskShape });
}

function checkShapeBase({ base, taskShape }: CheckNewTaskShapeInput): Result<true> {
  if (taskShape && base !== "TASK") {
    const message = "Only task types have a shape";
    return invalid({ message, issues: [{ path, message }] });
  }
  return ok({ value: true });
}

export type CheckShapeChangeInput = {
  context: Pick<OperationContext, "db">;
  type: { id: string; base: EntityBase; taskShape: TaskShape | null };
  taskShape: TaskShape | undefined;
};

/**
 * A task type's shape changes only while it has no active tasks (ADR 0117): a meeting's end
 * or a deadline's missing one would no longer fit (`CONFLICT`).
 */
export async function checkShapeChange({
  context,
  type,
  taskShape,
}: CheckShapeChangeInput): Promise<Result<true>> {
  const based = checkShapeBase({ base: type.base, taskShape });
  if (!based.ok || !taskShape || taskShape === type.taskShape) return based;
  const tasks = await context.db.task.count({ where: { entityTypeId: type.id } });
  if (tasks === 0) return ok({ value: true });
  const message = `${tasks} active tasks have the type; its shape cannot change`;
  return conflict({ message, issues: [{ path, message }] });
}
