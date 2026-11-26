import { ok, type Result } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { updateRecord } from "../../records/update-record";
import { notFound } from "../../shared/errors";
import { toJson } from "../../shared/to-json";
import { checkNewAssignee } from "../assignment/assign-on-create";
import { saveAssignee } from "../assignment/write-assignment";
import { mergeFields, validateFields } from "../field-definition/field-values";
import { notifyTaskAssigned } from "../notification/task-follow-ups";
import { type TaskDto, TaskSchema, type TaskUpdateInput, TaskUpdateInputSchema } from "./schema";
import { syncTaskHolds } from "./sync-task-holds";
import { checkTaskItems, inputPath, writeTaskItems } from "./task-items";
import { checkParty, checkTaskAccess, checkTaskOrder, loadTaskType } from "./task-rules";
import { loadTask } from "./to-task-dto";

/** A given value replaces the stored one, `undefined` keeps it (null clears it). */
const pick = <T>({ given, kept }: { given: T | undefined; kept: T }): T =>
  given === undefined ? kept : given;

type FieldsInput = {
  context: OperationContext;
  before: TaskDto;
  entityTypeId: string;
  patch: TaskUpdateInput["fields"];
};

/** The merged field values when they or the type change, validated against the type. */
async function changedFields({ context, before, entityTypeId, patch }: FieldsInput) {
  if (!patch && entityTypeId === before.type.id) return ok({ value: null });
  const values = patch ? mergeFields({ before: before.fields, patch }) : before.fields;
  const checked = await validateFields({ context, entityTypeId, values });
  if (!checked.ok) return checked;
  const json = toJson({ value: checked.value.fields }) ?? {};
  return ok({ value: { json, links: checked.value.links } });
}

type ChecksInput = { context: OperationContext; before: TaskDto; input: TaskUpdateInput };

/** The task as it will be: party, order, rooms and assignee checked (ADR 0117 amended, 0120). */
async function checkUpdate({ context, before, input }: ChecksInput): Promise<Result<true>> {
  const customerId = pick({ given: input.customerId, kept: before.customerId });
  const contactId = pick({ given: input.contactId, kept: before.contactId });
  const orderId = pick({ given: input.orderId, kept: before.orderId });
  for (const check of [
    await checkParty({ context, customerId, contactId, orderId }),
    await checkTaskOrder({ context, orderId, customerId, changed: orderId !== before.orderId }),
    await checkTaskItems({ context, items: input.items }),
    await checkNewAssignee({ context, assigneeId: input.assigneeId }),
  ]) {
    if (!check.ok) return check;
  }
  return ok({ value: true });
}

export const updateTask = defineOperation({
  name: "task.update",
  kind: "command",
  description:
    "Change a task's type, customer, contact, order, due time, rooms, note or field values; " +
    "omitted properties are unchanged and null clears one. `fields` is merged by key. " +
    "assigneeId changes the assignee, who is told. customerId moves the task to another " +
    "customer: pass a contactId at it (or null) and orderId null (or an order of it), since " +
    "contact and order belong to the customer; customerId null clears the customer, so " +
    "contactId and orderId must be null too. items replaces the rooms as a set; a BOOK that " +
    "collides is CONFLICT at items.<i>.",
  input: TaskUpdateInputSchema,
  output: TaskSchema,
  permission: "task:write",
  followUp: notifyTaskAssigned,
  handler: async ({ input, context }) => {
    const { id, fields: patch, assigneeId, items, ...data } = input;
    const before = await loadTask({ context, id });
    if (!before) return notFound({ entity: "Task" });
    // customerId, contactId, orderId and items each need their feature's read.
    const access = checkTaskAccess({ context, refs: { ...data, items } });
    if (!access.ok) return access;
    const entityTypeId = data.entityTypeId ?? before.type.id;
    const type = await loadTaskType({ context, entityTypeId });
    if (!type.ok) return type;
    const checked = await checkUpdate({ context, before, input });
    if (!checked.ok) return checked;
    const fields = await changedFields({ context, before, entityTypeId, patch });
    if (!fields.ok) return fields;
    const change = { fields: fields.value?.json, links: fields.value?.links, entityTypeId };
    await updateRecord({ context, id, change });
    if (assigneeId !== undefined && assigneeId !== before.assigneeId) {
      await saveAssignee({ context, subjectType: "TASK", subjectId: id, assigneeId });
    }
    await context.db.task.update({
      where: { id },
      data: {
        entityTypeId,
        customerId: pick({ given: data.customerId, kept: before.customerId }),
        contactId: pick({ given: data.contactId, kept: before.contactId }),
        orderId: pick({ given: data.orderId, kept: before.orderId }),
        dueAt: pick({ given: data.dueAt, kept: before.dueAt }),
        ...(data.note === undefined ? {} : { note: data.note }),
        ...(fields.value ? { fields: fields.value.json } : {}),
      },
    });
    if (items) {
      await writeTaskItems({ context, taskId: id, items });
      const held = await syncTaskHolds({ context, taskId: id, pathOf: inputPath({ items }) });
      if (!held.ok) return held;
    }
    const task = await loadTask({ context, id });
    if (!task) return notFound({ entity: "Task" });
    context.recordChange({ entityId: id, before, after: task });
    return ok({ value: task });
  },
});
