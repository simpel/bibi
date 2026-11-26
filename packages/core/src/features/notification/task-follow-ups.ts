import { z } from "zod";
import type { FollowUpInput, OperationContext } from "../../operations/types";
import { notify } from "./notify";

type AnyFollowUp = FollowUpInput<unknown, unknown>;

const TaskOutput = z.object({ id: z.string(), assigneeId: z.string().nullable() });

type TellInput = { context: OperationContext; taskId: string; assigneeId: string };

/**
 * Tells the task's assignee (ADR 0117), once per assignment: nobody is told again while an
 * ASSIGNED notification about the task is newer than the assignment's last change.
 */
async function tellAssignee({ context, taskId, assigneeId }: TellInput) {
  const [assignment, task] = await Promise.all([
    context.db.assignment.findFirst({
      where: { recordId: taskId, responsibilityId: null, assigneeId },
      select: { updatedAt: true },
    }),
    context.db.task.findFirst({
      where: { id: taskId },
      select: { dueAt: true, entityType: { select: { name: true } } },
    }),
  ]);
  if (!assignment || !task) return;
  const told = await context.db.notification.count({
    where: {
      taskId,
      recipientUserId: assigneeId,
      kind: "ASSIGNED",
      createdAt: { gte: assignment.updatedAt },
    },
  });
  if (told > 0) return;
  const data = {
    taskTypeName: task.entityType.name,
    taskDueAt: task.dueAt?.toISOString() ?? null,
  };
  await notify({ context, kind: "ASSIGNED", userIds: [assigneeId], taskId, data });
}

/** `task.create|update`: the task's assignee, when newly assigned. */
export async function notifyTaskAssigned({ output, context }: AnyFollowUp) {
  const parsed = TaskOutput.safeParse(output);
  if (!parsed.success || !parsed.data.assigneeId) return;
  const { id: taskId, assigneeId } = parsed.data;
  await tellAssignee({ context, taskId, assigneeId });
}

const AssignmentOutput = z.object({
  subjectId: z.string(),
  assigneeId: z.string().nullable(),
  assigneeSource: z.string().nullable(),
});

/** `assignment.assign` on a task: its new assignee. */
export async function notifyTaskAssignment({ output, context }: AnyFollowUp) {
  const parsed = AssignmentOutput.safeParse(output);
  if (!parsed.success || parsed.data.assigneeSource !== "EXPLICIT") return;
  const { subjectId: taskId, assigneeId } = parsed.data;
  if (assigneeId) await tellAssignee({ context, taskId, assigneeId });
}
