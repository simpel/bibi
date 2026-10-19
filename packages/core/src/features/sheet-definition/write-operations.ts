import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { checkSheetContents } from "./check-contents";
import {
  type SheetDefinitionContents,
  SheetDefinitionCreateInputSchema,
  type SheetDefinitionDto,
  SheetDefinitionIdInputSchema,
  SheetDefinitionSchema,
  SheetDefinitionUpdateInputSchema,
} from "./schema";
import { findSheetDefinition, replaceSheetLinks } from "./sheet-definition-rows";

type NameTakenInput = { context: Pick<OperationContext, "db">; name: string; id?: string };

async function nameTaken({ context, name, id }: NameTakenInput) {
  const found = await context.db.sheetDefinition.findFirst({ where: { name } });
  return found !== null && found.id !== id;
}

const taken = ({ name }: { name: string }) =>
  conflict({ message: `A sheet named "${name}" exists` });

type SaveLinksInput = {
  context: OperationContext;
  id: string;
  contents: SheetDefinitionContents;
  before?: SheetDefinitionDto;
};

/** Writes the id lists as join rows and records the change with the stored shape. */
async function saveLinks({ context, id, contents, before }: SaveLinksInput) {
  await replaceSheetLinks({ context, sheetDefinitionId: id, contents });
  const after = await findSheetDefinition({ context, id });
  if (!after) return notFound({ entity: "Sheet" });
  context.recordChange({ entityId: id, ...(before ? { before } : {}), after });
  return ok({ value: after });
}

export const createSheetDefinition = defineOperation({
  name: "sheetDefinition.create",
  kind: "command",
  description:
    "Define a sheet, e.g. Kitchen order: the item types and fields it includes, the lists whose " +
    "requirements it counts and the responsibility it goes to (e.g. Head of kitchen). " +
    "Sheet names are unique. Every id must be an active item type, a field of one of those " +
    "types, a list or a responsibility (else VALIDATION).",
  input: SheetDefinitionCreateInputSchema,
  output: SheetDefinitionSchema,
  permission: "configuration:write",
  handler: async ({ input: { name, ...given }, context }) => {
    if (await nameTaken({ context, name })) return taken({ name });
    const contents = await checkSheetContents({ context, contents: given });
    if (!contents.ok) return contents;
    const { responsibilityId } = contents.value;
    const { id } = await context.db.sheetDefinition.create({
      data: { name, responsibilityId, organizationId: context.organizationId },
    });
    return saveLinks({ context, id, contents: contents.value });
  },
});

export const updateSheetDefinition = defineOperation({
  name: "sheetDefinition.update",
  kind: "command",
  description:
    "Rename a sheet definition or replace its item types, fields, lists or receiving " +
    "responsibility. " +
    "Omitted fields are unchanged. Fields must belong to the resulting item types.",
  input: SheetDefinitionUpdateInputSchema,
  output: SheetDefinitionSchema,
  permission: "configuration:write",
  handler: async ({ input: { id, name, ...changes }, context }) => {
    const before = await findSheetDefinition({ context, id });
    if (!before) return notFound({ entity: "Sheet" });
    if (name && (await nameTaken({ context, name, id }))) return taken({ name });
    const { entityTypeIds, fieldIds, vocabularyIds, responsibilityId } = {
      ...before,
      ...definedOnly({ changes }),
    };
    const contents = await checkSheetContents({
      context,
      contents: { entityTypeIds, fieldIds, vocabularyIds, responsibilityId },
    });
    if (!contents.ok) return contents;
    await context.db.sheetDefinition.update({
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

export const archiveSheetDefinition = defineOperation({
  name: "sheetDefinition.archive",
  kind: "command",
  description: "Archive a sheet definition. Its name can then be reused.",
  input: SheetDefinitionIdInputSchema,
  output: SheetDefinitionSchema,
  permission: "configuration:write",
  handler: async ({ input: { id }, context }) => {
    const before = await findSheetDefinition({ context, id });
    if (!before) return notFound({ entity: "Sheet" });
    const row = await context.db.sheetDefinition.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
    const after = { ...before, ...row };
    context.recordChange({ entityId: id, before, after });
    return ok({ value: after });
  },
});
