import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { createRecord } from "../../records/create-record";
import type { LinkValue } from "../../records/record-links";
import { updateRecord } from "../../records/update-record";
import { notFound } from "../../shared/errors";
import { toJson } from "../../shared/to-json";
import { checkNewAssignee } from "../assignment/assign-on-create";
import { saveAssignee } from "../assignment/write-assignment";
import { mergeFields, validateFields } from "../field-definition/field-values";
import { notifyTaskAssigned } from "../notification/task-follow-ups";
import { linkTasks, loadLinkableOrder } from "./link-order";
import { TaskCreateInputSchema, TaskSchema, TaskUpdateInputSchema } from "./schema";
import { checkParty, checkTaskAccess, checkTaskItem, checkTimes, loadTaskType } from "./task-rules";
import { loadTask, TASK_INCLUDE, toTaskDtos } from "./to-task-dto";

export const createTask = defineOperation({
  name: "task.create",
  kind: "command",
  description:
    "Create a task around a customer (ADR 0117): a site visit, tasting or deadline of one of the " +
    "organization's task types (entityType.list base TASK). Customer and a contact at it are " +
    "required. A MEETING type needs startsAt and endsAt (after it); a DEADLINE type takes only " +
    "startsAt (the due time). itemId names an item, e.g. the room to show: it never holds it and " +
    "only warns (ITEM_BUSY) when busy. orderId links an active order of the same customer. The " +
    "assignee defaults to the caller and is told. Needs customer:read (item:read, order:read).",
  input: TaskCreateInputSchema,
  output: TaskSchema,
  permission: "task:write",
  followUp: notifyTaskAssigned,
  handler: async ({ input, context }) => {
    const { entityTypeId, customerId, contactId, orderId, itemId, fields } = input;
    const access = checkTaskAccess({ context, refs: { customerId, contactId, itemId, orderId } });
    if (!access.ok) return access;
    const type = await loadTaskType({ context, entityTypeId });
    if (!type.ok) return type;
    const endsAt = input.endsAt ?? null;
    for (const check of [
      checkTimes({ shape: type.value.shape, startsAt: input.startsAt, endsAt }),
      await checkParty({ context, customerId, contactId }),
      await checkTaskItem({ context, itemId }),
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
            ...{ id, entityTypeId, customerId, contactId, itemId: itemId ?? null },
            ...{ startsAt: input.startsAt, endsAt, note: input.note ?? null },
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
    const task = await loadTask({ context, id: row.id });
    if (!task) return notFound({ entity: "Task" });
    context.recordChange({ entityId: row.id, after: task });
    return ok({ value: task });
  },
});

export const updateTask = defineOperation({
  name: "task.update",
  kind: "command",
  description:
    "Change a task's type, contact (at the same customer), item, times, note or field values. " +
    "`fields` is merged by key (null clears a value). The times must fit the type's shape " +
    "(MEETING: endsAt after startsAt; DEADLINE: no endsAt; pass endsAt null when switching to a " +
    "deadline type). assigneeId changes the assignee, who is told. The customer never " +
    "changes; link an order with task.linkOrder.",
  input: TaskUpdateInputSchema,
  output: TaskSchema,
  permission: "task:write",
  followUp: notifyTaskAssigned,
  handler: async ({ input: { id, fields: patch, assigneeId, ...data }, context }) => {
    const before = await loadTask({ context, id });
    if (!before) return notFound({ entity: "Task" });
    const access = checkTaskAccess({ context, refs: data });
    if (!access.ok) return access;
    const entityTypeId = data.entityTypeId ?? before.type.id;
    const type = await loadTaskType({ context, entityTypeId });
    if (!type.ok) return type;
    const startsAt = data.startsAt ?? before.startsAt;
    const endsAt = data.endsAt === undefined ? before.endsAt : data.endsAt;
    const contactId = data.contactId ?? before.contactId;
    for (const check of [
      checkTimes({ shape: type.value.shape, startsAt, endsAt }),
      await checkParty({ context, customerId: before.customerId, contactId }),
      await checkTaskItem({ context, itemId: data.itemId }),
      await checkNewAssignee({ context, assigneeId }),
    ]) {
      if (!check.ok) return check;
    }
    let json: ReturnType<typeof toJson>;
    let links: LinkValue[] | undefined;
    if (patch || entityTypeId !== before.type.id) {
      const values = patch ? mergeFields({ before: before.fields, patch }) : before.fields;
      const checked = await validateFields({ context, entityTypeId, values });
      if (!checked.ok) return checked;
      json = toJson({ value: checked.value.fields }) ?? {};
      links = checked.value.links;
    }
    await updateRecord({ context, id, change: { fields: json, links, entityTypeId } });
    if (assigneeId !== undefined && assigneeId !== before.assigneeId) {
      await saveAssignee({ context, subjectType: "TASK", subjectId: id, assigneeId });
    }
    const row = await context.db.task.update({
      where: { id },
      data: {
        ...{ entityTypeId, contactId, startsAt, endsAt },
        ...(data.itemId === undefined ? {} : { itemId: data.itemId }),
        ...(data.note === undefined ? {} : { note: data.note }),
        ...(json ? { fields: json } : {}),
      },
      include: TASK_INCLUDE,
    });
    const [task] = await toTaskDtos({ context, rows: [row] });
    if (!task) return notFound({ entity: "Task" });
    context.recordChange({ entityId: id, before, after: task });
    return ok({ value: task });
  },
});
