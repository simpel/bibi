import type { Prisma } from "@bibi/db";
import type { OperationContext } from "../../operations/types";
import type { WorkOrderDefinitionContents, WorkOrderDefinitionDto } from "./schema";

type Db = { context: Pick<OperationContext, "db"> };

const byPosition = { orderBy: { position: "asc" } } as const;

/** The join rows (ADR 0056) a definition's id lists are read from, in the given order. */
export const WORK_ORDER_DEFINITION_INCLUDE = {
  entityTypes: { select: { entityTypeId: true }, ...byPosition },
  fields: { select: { fieldId: true }, ...byPosition },
  vocabularies: { select: { vocabularyId: true }, ...byPosition },
} satisfies Prisma.WorkOrderDefinitionInclude;

export type WorkOrderDefinitionRow = Prisma.WorkOrderDefinitionGetPayload<{
  include: typeof WORK_ORDER_DEFINITION_INCLUDE;
}>;

/** The API shape: the join rows as id lists. */
export function toWorkOrderDefinitionDto({
  row,
}: {
  row: WorkOrderDefinitionRow;
}): WorkOrderDefinitionDto {
  const { entityTypes, fields, vocabularies, ...rest } = row;
  return {
    ...rest,
    entityTypeIds: entityTypes.map((link) => link.entityTypeId),
    fieldIds: fields.map((link) => link.fieldId),
    vocabularyIds: vocabularies.map((link) => link.vocabularyId),
  };
}

export type FindWorkOrderDefinitionInput = Db & { id: string };

/** One active definition of the organization with its id lists, or null. */
export async function findWorkOrderDefinition({
  context,
  id,
}: FindWorkOrderDefinitionInput): Promise<WorkOrderDefinitionDto | null> {
  const row = await context.db.workOrderDefinition.findFirst({
    where: { id },
    include: WORK_ORDER_DEFINITION_INCLUDE,
  });
  return row ? toWorkOrderDefinitionDto({ row }) : null;
}

export type ReplaceWorkOrderLinksInput = {
  context: OperationContext;
  workOrderDefinitionId: string;
  contents: WorkOrderDefinitionContents;
};

/** Replaces the included types, fields and lists. Audit has the definition. */
export async function replaceWorkOrderLinks({
  context,
  workOrderDefinitionId,
  contents,
}: ReplaceWorkOrderLinksInput) {
  const { db, organizationId } = context;
  const where = { workOrderDefinitionId };
  const row = { ...where, organizationId };
  await db.workOrderDefinitionEntityType.deleteMany({ where });
  await db.workOrderDefinitionField.deleteMany({ where });
  await db.workOrderDefinitionVocabulary.deleteMany({ where });
  await db.workOrderDefinitionEntityType.createMany({
    data: contents.entityTypeIds.map((entityTypeId, position) => ({
      ...row,
      entityTypeId,
      position,
    })),
  });
  await db.workOrderDefinitionField.createMany({
    data: contents.fieldIds.map((fieldId, position) => ({ ...row, fieldId, position })),
  });
  await db.workOrderDefinitionVocabulary.createMany({
    data: contents.vocabularyIds.map((vocabularyId, position) => ({
      ...row,
      vocabularyId,
      position,
    })),
  });
}
