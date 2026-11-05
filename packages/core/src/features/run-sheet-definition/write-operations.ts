import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { checkRunSheetContents } from "./check-contents";
import { findRunSheetDefinition, replaceRunSheetLinks } from "./run-sheet-definition-rows";
import {
  type RunSheetDefinitionContents,
  RunSheetDefinitionCreateInputSchema,
  type RunSheetDefinitionDto,
  RunSheetDefinitionIdInputSchema,
  RunSheetDefinitionSchema,
  RunSheetDefinitionUpdateInputSchema,
} from "./schema";

type NameTakenInput = { context: Pick<OperationContext, "db">; name: string; id?: string };

async function nameTaken({ context, name, id }: NameTakenInput) {
  const found = await context.db.runSheetDefinition.findFirst({ where: { name } });
  return found !== null && found.id !== id;
}

const taken = ({ name }: { name: string }) =>
  conflict({ message: `A run sheet named "${name}" exists` });

type SaveLinksInput = {
  context: OperationContext;
  id: string;
  contents: RunSheetDefinitionContents;
  before?: RunSheetDefinitionDto;
};

/** Writes the id lists as join rows and records the change with the stored shape. */
async function saveLinks({ context, id, contents, before }: SaveLinksInput) {
  await replaceRunSheetLinks({ context, runSheetDefinitionId: id, contents });
  const after = await findRunSheetDefinition({ context, id });
  if (!after) return notFound({ entity: "RunSheet" });
  context.recordChange({ entityId: id, ...(before ? { before } : {}), after });
  return ok({ value: after });
}

export const createRunSheetDefinition = defineOperation({
  name: "runSheetDefinition.create",
  kind: "command",
  description:
    "Define a run sheet, e.g. Kitchen order: the item types and fields it includes, the lists whose " +
    "requirements it counts and the responsibility it goes to (e.g. Head of kitchen). " +
    "Run sheet names are unique. Every id must be an active item type, a field of one of those " +
    "types, a list or a responsibility (else VALIDATION).",
  input: RunSheetDefinitionCreateInputSchema,
  output: RunSheetDefinitionSchema,
  permission: "template:write",
  handler: async ({ input: { name, ...given }, context }) => {
    if (await nameTaken({ context, name })) return taken({ name });
    const contents = await checkRunSheetContents({ context, contents: given });
    if (!contents.ok) return contents;
    const { responsibilityId } = contents.value;
    const { id } = await context.db.runSheetDefinition.create({
      data: { name, responsibilityId, organizationId: context.organizationId },
    });
    return saveLinks({ context, id, contents: contents.value });
  },
});

export const updateRunSheetDefinition = defineOperation({
  name: "runSheetDefinition.update",
  kind: "command",
  description:
    "Rename a run sheet definition or replace its item types, fields, lists or receiving " +
    "responsibility. " +
    "Omitted fields are unchanged. Fields must belong to the resulting item types.",
  input: RunSheetDefinitionUpdateInputSchema,
  output: RunSheetDefinitionSchema,
  permission: "template:write",
  handler: async ({ input: { id, name, ...changes }, context }) => {
    const before = await findRunSheetDefinition({ context, id });
    if (!before) return notFound({ entity: "RunSheet" });
    if (name && (await nameTaken({ context, name, id }))) return taken({ name });
    const { entityTypeIds, fieldIds, vocabularyIds, responsibilityId } = {
      ...before,
      ...definedOnly({ changes }),
    };
    const contents = await checkRunSheetContents({
      context,
      contents: { entityTypeIds, fieldIds, vocabularyIds, responsibilityId },
    });
    if (!contents.ok) return contents;
    await context.db.runSheetDefinition.update({
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

export const archiveRunSheetDefinition = defineOperation({
  name: "runSheetDefinition.archive",
  kind: "command",
  description: "Archive a run sheet definition. Its name can then be reused.",
  input: RunSheetDefinitionIdInputSchema,
  output: RunSheetDefinitionSchema,
  permission: "template:delete",
  handler: async ({ input: { id }, context }) => {
    const before = await findRunSheetDefinition({ context, id });
    if (!before) return notFound({ entity: "RunSheet" });
    const row = await context.db.runSheetDefinition.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
    const after = RunSheetDefinitionSchema.parse({ ...before, ...row });
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});
