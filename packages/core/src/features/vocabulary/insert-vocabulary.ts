import type { Result } from "../../errors/result";
import { ok } from "../../errors/result";
import type { OperationContext } from "../../operations/types";
import { conflict } from "../../shared/errors";
import { findVocabularyByName, toVocabularyDto } from "./load-vocabulary";
import type { VocabularyCreateInput, VocabularyDto } from "./schema";

export type InsertVocabularyInput = { context: OperationContext } & VocabularyCreateInput;

/** Shared by `vocabulary.create` and `vocabulary.importTemplate`: unique name, insert, record. */
export async function insertVocabulary({
  context,
  name,
  values = [],
}: InsertVocabularyInput): Promise<Result<VocabularyDto>> {
  if (await findVocabularyByName({ context, name })) {
    return conflict({ message: `A list named "${name}" exists` });
  }
  const createdBy = context.actor.userId;
  const row = await context.db.vocabulary.create({
    data: { name, organizationId: context.organizationId, createdBy },
  });
  await context.db.vocabularyValue.createMany({
    data: values.map((value, position) => ({
      vocabularyId: row.id,
      name: value,
      position,
      organizationId: context.organizationId,
      createdBy,
    })),
  });
  const vocabulary = await toVocabularyDto({ context, row });
  context.recordChange({ entityId: row.id, after: vocabulary });
  return ok({ value: vocabulary });
}
