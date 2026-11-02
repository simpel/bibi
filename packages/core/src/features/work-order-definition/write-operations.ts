import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { checkWorkOrderContents } from "./check-contents";
import {
  type WorkOrderDefinitionContents,
  WorkOrderDefinitionCreateInputSchema,
  type WorkOrderDefinitionDto,
  WorkOrderDefinitionIdInputSchema,
  WorkOrderDefinitionSchema,
  WorkOrderDefinitionUpdateInputSchema,
} from "./schema";
import { findWorkOrderDefinition, replaceWorkOrderLinks } from "./work-order-definition-rows";

type NameTakenInput = { context: Pick<OperationContext, "db">; name: string; id?: string };

async function nameTaken({ context, name, id }: NameTakenInput) {
  const found = await context.db.workOrderDefinition.findFirst({ where: { name } });
  return found !== null && found.id !== id;
}

const taken = ({ name }: { name: string }) =>
  conflict({ message: `A work order named "${name}" exists` });

type SaveLinksInput = {
  context: OperationContext;
  id: string;
  contents: WorkOrderDefinitionContents;
  before?: WorkOrderDefinitionDto;
};

/** Writes the id lists as join rows and records the change with the stored shape. */
async function saveLinks({ context, id, contents, before }: SaveLinksInput) {
  await replaceWorkOrderLinks({ context, workOrderDefinitionId: id, contents });
  const after = await findWorkOrderDefinition({ context, id });
  if (!after) return notFound({ entity: "WorkOrder" });
  context.recordChange({ entityId: id, ...(before ? { before } : {}), after });
  return ok({ value: after });
}

export const createWorkOrderDefinition = defineOperation({
  name: "workOrderDefinition.create",
  kind: "command",
  description:
    "Define a work order, e.g. Kitchen order: the item types and fields it includes, the lists whose " +
    "requirements it counts and the responsibility it goes to (e.g. Head of kitchen). " +
    "Work order names are unique. Every id must be an active item type, a field of one of those " +
    "types, a list or a responsibility (else VALIDATION).",
  input: WorkOrderDefinitionCreateInputSchema,
  output: WorkOrderDefinitionSchema,
  permission: "template:write",
  handler: async ({ input: { name, ...given }, context }) => {
    if (await nameTaken({ context, name })) return taken({ name });
    const contents = await checkWorkOrderContents({ context, contents: given });
    if (!contents.ok) return contents;
    const { responsibilityId } = contents.value;
    const { id } = await context.db.workOrderDefinition.create({
      data: { name, responsibilityId, organizationId: context.organizationId },
    });
    return saveLinks({ context, id, contents: contents.value });
  },
});

export const updateWorkOrderDefinition = defineOperation({
  name: "workOrderDefinition.update",
  kind: "command",
  description:
    "Rename a work order definition or replace its item types, fields, lists or receiving " +
    "responsibility. " +
    "Omitted fields are unchanged. Fields must belong to the resulting item types.",
  input: WorkOrderDefinitionUpdateInputSchema,
  output: WorkOrderDefinitionSchema,
  permission: "template:write",
  handler: async ({ input: { id, name, ...changes }, context }) => {
    const before = await findWorkOrderDefinition({ context, id });
    if (!before) return notFound({ entity: "WorkOrder" });
    if (name && (await nameTaken({ context, name, id }))) return taken({ name });
    const { entityTypeIds, fieldIds, vocabularyIds, responsibilityId } = {
      ...before,
      ...definedOnly({ changes }),
    };
    const contents = await checkWorkOrderContents({
      context,
      contents: { entityTypeIds, fieldIds, vocabularyIds, responsibilityId },
    });
    if (!contents.ok) return contents;
    await context.db.workOrderDefinition.update({
      where: { id },
      data: { ...(name ? { name } : {}), responsibilityId: contents.value.responsibilityId },
    });
    return saveLinks({ context, id, contents: contents.value, before });
  },
});

/** Drops keys whose value is `undefined`, so a spread keeps the stored value. */
function definedOnly<T extends object>({ changes }: { changes: T }): Partial<T> {
  return Object.fromEntries(
    Object.entries(changes).filter(([, value]) => value !== undefined),
  ) as Partial<T>;
}

export const archiveWorkOrderDefinition = defineOperation({
  name: "workOrderDefinition.archive",
  kind: "command",
  description: "Archive a work order definition. Its name can then be reused.",
  input: WorkOrderDefinitionIdInputSchema,
  output: WorkOrderDefinitionSchema,
  permission: "template:delete",
  handler: async ({ input: { id }, context }) => {
    const before = await findWorkOrderDefinition({ context, id });
    if (!before) return notFound({ entity: "WorkOrder" });
    const row = await context.db.workOrderDefinition.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
    const after = WorkOrderDefinitionSchema.parse({ ...before, ...row });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});
