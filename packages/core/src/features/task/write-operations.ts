import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { createRecord } from "../../records/create-record";
import { notFound } from "../../shared/errors";
import { toJson } from "../../shared/to-json";
import { checkNewAssignee } from "../assignment/assign-on-create";
import { saveAssignee } from "../assignment/write-assignment";
import { validateFields } from "../field-definition/field-values";
import { notifyTaskAssigned } from "../notification/task-follow-ups";
import { linkTasks, loadLinkableOrder } from "./link-order";
import { TaskCreateInputSchema, TaskSchema } from "./schema";
import { syncTaskHolds } from "./sync-task-holds";
import { checkTaskItems, inputPath, writeTaskItems } from "./task-items";
import { checkParty, checkTaskAccess, loadTaskType } from "./task-rules";
import { loadTask } from "./to-task-dto";

export const createTask = defineOperation({
  name: "task.create",
  kind: "command",
  description:
    "Create a task (ADR 0117, 0120): a site visit, tasting, deadline or note to self, of one " +
    "of the organization's task types (entityType.list base TASK). Only the type is required. " +
    "customerId, a contactId at it (needs the customer) and orderId (an active order of the " +
    "same customer) are optional; dueAt is one optional due time. items lists rooms: RELATED " +
    "only names one, PREBOOK holds it soft and BOOK hard for its own startsAt-endsAt while the " +
    "task is open (a BOOK that collides is CONFLICT at items.<i>). The assignee defaults to " +
    "the caller and is told. Needs customer:read, item:read and order:read for what is given.",
  input: TaskCreateInputSchema,
  output: TaskSchema,
  permission: "task:write",
  followUp: notifyTaskAssigned,
  handler: async ({ input, context }) => {
    const { entityTypeId, orderId, items, fields } = input;
    const customerId = input.customerId ?? null;
    const contactId = input.contactId ?? null;
    const access = checkTaskAccess({ context, refs: { customerId, contactId, items, orderId } });
    if (!access.ok) return access;
    const type = await loadTaskType({ context, entityTypeId });
    if (!type.ok) return type;
    for (const check of [
      await checkParty({ context, customerId, contactId, orderId: orderId ?? null }),
      await checkTaskItems({ context, items }),
      await checkNewAssignee({ context, assigneeId: input.assigneeId }),
    ]) {
      if (!check.ok) return check;
    }
    const order = orderId ? await loadLinkableOrder({ context, orderId, path: "orderId" }) : null;
    if (order && !order.ok) return order;
    const checked = await validateFields({ context, entityTypeId, values: fields ?? {} });
    if (!checked.ok) return checked;
    const row = await createRecord({
      context,
      base: "TASK",
      entityTypeId,
      fields: checked.value.fields,
      links: checked.value.links,
      insert: ({ id }) =>
        context.db.task.create({
          data: {
            ...{ id, entityTypeId, customerId, contactId, dueAt: input.dueAt ?? null },
            note: input.note ?? null,
            fields: toJson({ value: checked.value.fields }) ?? {},
            organizationId: context.organizationId,
          },
        }),
    });
    const assigneeId = input.assigneeId === undefined ? context.actor.userId : input.assigneeId;
    if (assigneeId) {
      await saveAssignee({ context, subjectType: "TASK", subjectId: row.id, assigneeId });
    }
    if (order?.ok) {
      const linked = await linkTasks({
        ...{ context, orderId: order.value.id, customerId: order.value.customerId },
        ...{ taskIds: [row.id], pathOf: () => "orderId" },
      });
      if (!linked.ok) return linked;
    }
    if (items && items.length > 0) {
      await writeTaskItems({ context, taskId: row.id, items });
      const held = await syncTaskHolds({ context, taskId: row.id, pathOf: inputPath({ items }) });
      if (!held.ok) return held;
    }
    const task = await loadTask({ context, id: row.id });
    if (!task) return notFound({ entity: "Task" });
    context.recordChange({ entityId: row.id, after: task });
    return ok({ value: task });
  },
});
