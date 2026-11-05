import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { RunSheetDefinitionContents, RunSheetDefinitionDto } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

const byPosition = { orderBy: { position: "asc" } } as const;

/** The join rows (ADR 0056) a definition's id lists are read from, in the given order. */
export const RUN_SHEET_DEFINITION_INCLUDE = {
  entityTypes: { select: { entityTypeId: true }, ...byPosition },
  fields: { select: { fieldId: true }, ...byPosition },
  vocabularies: { select: { vocabularyId: true }, ...byPosition },
} satisfies Prisma.RunSheetDefinitionInclude;

export type RunSheetDefinitionRow = Prisma.RunSheetDefinitionGetPayload<{
  include: typeof RUN_SHEET_DEFINITION_INCLUDE;
}>;

/** The API shape: the join rows as id lists. */
export function toRunSheetDefinitionDto({
  row,
}: {
  row: RunSheetDefinitionRow;
}): RunSheetDefinitionDto {
  const { entityTypes, fields, vocabularies, ...rest } = row;
  return {
    ...rest,
    entityTypeIds: entityTypes.map((link) => link.entityTypeId),
    fieldIds: fields.map((link) => link.fieldId),
    vocabularyIds: vocabularies.map((link) => link.vocabularyId),
  };
}

export type FindRunSheetDefinitionInput = Db & { id: string };

/** One active definition of the organization with its id lists, or null. */
export async function findRunSheetDefinition({
  context,
  id,
}: FindRunSheetDefinitionInput): Promise<RunSheetDefinitionDto | null> {
  const row = await context.db.runSheetDefinition.findFirst({
    where: { id },
    include: RUN_SHEET_DEFINITION_INCLUDE,
  });
  return row ? toRunSheetDefinitionDto({ row }) : null;
}

export type ReplaceRunSheetLinksInput = {
  context: OperationContext;
  runSheetDefinitionId: string;
  contents: RunSheetDefinitionContents;
};

/** Replaces the included types, fields and lists. Audit has the definition. */
export async function replaceRunSheetLinks({
  context,
  runSheetDefinitionId,
  contents,
}: ReplaceRunSheetLinksInput) {
  const { db, organizationId } = context;
  const where = { runSheetDefinitionId };
  const row = { ...where, organizationId };
  await db.runSheetDefinitionEntityType.deleteMany({ where });
  await db.runSheetDefinitionField.deleteMany({ where });
  await db.runSheetDefinitionVocabulary.deleteMany({ where });
  await db.runSheetDefinitionEntityType.createMany({
    data: contents.entityTypeIds.map((entityTypeId, position) => ({
      ...row,
      entityTypeId,
      position,
    })),
  });
  await db.runSheetDefinitionField.createMany({
    data: contents.fieldIds.map((fieldId, position) => ({ ...row, fieldId, position })),
  });
  await db.runSheetDefinitionVocabulary.createMany({
    data: contents.vocabularyIds.map((vocabularyId, position) => ({
      ...row,
      vocabularyId,
      position,
    })),
  });
}
