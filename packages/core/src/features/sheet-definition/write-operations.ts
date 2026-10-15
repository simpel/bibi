import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import type { OperationContext } from "../../operations/types";
import { conflict, notFound } from "../../shared/errors";
import { checkSheetContents } from "./check-contents";
import {
  SheetDefinitionCreateInputSchema,
  SheetDefinitionIdInputSchema,
  SheetDefinitionSchema,
  SheetDefinitionUpdateInputSchema,
} from "./schema";

type NameTakenInput = { context: Pick<OperationContext, "db">; name: string; id?: string };

async function nameTaken({ context, name, id }: NameTakenInput) {
  const found = await context.db.sheetDefinition.findFirst({ where: { name } });
  return found !== null && found.id !== id;
}

const taken = ({ name }: { name: string }) =>
  conflict({ message: `A sheet named "${name}" exists` });

export const createSheetDefinition = defineOperation({
  name: "sheetDefinition.create",
  kind: "command",
  description:
    "Define a sheet, e.g. Kitchen order: the item types and fields it includes, the lists whose " +
    "requirements it counts and the role it goes to. Sheet names are unique. Every id must be " +
    "an active item type, a field of one of those types, a list or a role (else VALIDATION).",
  input: SheetDefinitionCreateInputSchema,
  output: SheetDefinitionSchema,
  permission: "configuration:write",
  handler: async ({ input: { name, ...given }, context }) => {
    if (await nameTaken({ context, name })) return taken({ name });
    const contents = await checkSheetContents({ context, contents: given });
    if (!contents.ok) return contents;
    const row = await context.db.sheetDefinition.create({
      data: { name, ...contents.value, organizationId: context.organizationId },
    });
    context.recordChange({ entityId: row.id, after: row });
    return ok({ value: row });
  },
});

export const updateSheetDefinition = defineOperation({
  name: "sheetDefinition.update",
  kind: "command",
  description:
    "Rename a sheet definition or replace its item types, fields, lists or receiving role. " +
    "Omitted fields are unchanged. Fields must belong to the resulting item types.",
  input: SheetDefinitionUpdateInputSchema,
  output: SheetDefinitionSchema,
  permission: "configuration:write",
  handler: async ({ input: { id, name, ...changes }, context }) => {
    const before = await context.db.sheetDefinition.findFirst({ where: { id } });
    if (!before) return notFound({ entity: "Sheet" });
    if (name && (await nameTaken({ context, name, id }))) return taken({ name });
    const { entityTypeIds, fieldIds, vocabularyIds, roleId } = {
      ...before,
      ...definedOnly({ changes }),
    };
    const contents = await checkSheetContents({
      context,
      contents: { entityTypeIds, fieldIds, vocabularyIds, roleId },
    });
    if (!contents.ok) return contents;
    const row = await context.db.sheetDefinition.update({
      where: { id },
      data: { ...(name ? { name } : {}), ...contents.value },
    });
    context.recordChange({ entityId: id, before, after: row });
    return ok({ value: row });
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
    const before = await context.db.sheetDefinition.findFirst({ where: { id } });
    if (!before) return notFound({ entity: "Sheet" });
    const row = await context.db.sheetDefinition.update({
      where: { id },
      data: { status: "ARCHIVED" },
    });
    context.recordChange({ entityId: id, before, after: row });
    return ok({ value: row });
  },
});
