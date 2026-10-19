import type { Prisma } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import type { SheetDefinitionContents, SheetDefinitionDto } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

const byPosition = { orderBy: { position: "asc" } } as const;

/** The join rows (ADR 0056) a definition's id lists are read from, in the given order. */
export const SHEET_DEFINITION_INCLUDE = {
  entityTypes: { select: { entityTypeId: true }, ...byPosition },
  fields: { select: { fieldId: true }, ...byPosition },
  vocabularies: { select: { vocabularyId: true }, ...byPosition },
} satisfies Prisma.SheetDefinitionInclude;

export type SheetDefinitionRow = Prisma.SheetDefinitionGetPayload<{
  include: typeof SHEET_DEFINITION_INCLUDE;
}>;

/** The API shape: the join rows as id lists. */
export function toSheetDefinitionDto({ row }: { row: SheetDefinitionRow }): SheetDefinitionDto {
  const { entityTypes, fields, vocabularies, ...rest } = row;
  return {
    ...rest,
    entityTypeIds: entityTypes.map((link) => link.entityTypeId),
    fieldIds: fields.map((link) => link.fieldId),
    vocabularyIds: vocabularies.map((link) => link.vocabularyId),
  };
}

export type FindSheetDefinitionInput = Db & { id: string };

/** One active definition of the organization with its id lists, or null. */
export async function findSheetDefinition({
  context,
  id,
}: FindSheetDefinitionInput): Promise<SheetDefinitionDto | null> {
  const row = await context.db.sheetDefinition.findFirst({
    where: { id },
    include: SHEET_DEFINITION_INCLUDE,
  });
  return row ? toSheetDefinitionDto({ row }) : null;
}

export type ReplaceSheetLinksInput = {
  context: OperationContext;
  sheetDefinitionId: string;
  contents: SheetDefinitionContents;
};

/** Replaces the included types, fields and lists. Audit has the definition. */
export async function replaceSheetLinks({
  context,
  sheetDefinitionId,
  contents,
}: ReplaceSheetLinksInput) {
  const { db, organizationId } = context;
  const where = { sheetDefinitionId };
  const row = { ...where, organizationId };
  await db.sheetDefinitionEntityType.deleteMany({ where });
  await db.sheetDefinitionField.deleteMany({ where });
  await db.sheetDefinitionVocabulary.deleteMany({ where });
  await db.sheetDefinitionEntityType.createMany({
    data: contents.entityTypeIds.map((entityTypeId, position) => ({
      ...row,
      entityTypeId,
      position,
    })),
  });
  await db.sheetDefinitionField.createMany({
    data: contents.fieldIds.map((fieldId, position) => ({ ...row, fieldId, position })),
  });
  await db.sheetDefinitionVocabulary.createMany({
    data: contents.vocabularyIds.map((vocabularyId, position) => ({
      ...row,
      vocabularyId,
      position,
    })),
  });
}
