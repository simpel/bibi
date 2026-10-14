import type { Vocabulary } from "@okazi/db";
import type { OperationContext } from "../../operations/types";
import type { VocabularyDto } from "./schema";

type Db = Pick<OperationContext, "db">;

export type ToVocabularyDtosInput = { context: Db; rows: readonly Vocabulary[] };

/** Attaches each list's active values (ordered) to the rows. One query for all lists. */
export async function toVocabularyDtos({
  context,
  rows,
}: ToVocabularyDtosInput): Promise<VocabularyDto[]> {
  const values = await context.db.vocabularyValue.findMany({
    where: { vocabularyId: { in: rows.map((row) => row.id) } },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: { id: true, vocabularyId: true, name: true, position: true },
  });
  return rows.map((row) => ({
    ...row,
    values: values.filter((value) => value.vocabularyId === row.id),
  }));
}

export type LoadVocabularyInput = { context: Db; id: string };

/** One active list with its values, or null. */
export async function loadVocabulary({
  context,
  id,
}: LoadVocabularyInput): Promise<VocabularyDto | null> {
  const row = await context.db.vocabulary.findFirst({ where: { id } });
  return row ? toVocabularyDto({ context, row }) : null;
}

export type ToVocabularyDtoInput = { context: Db; row: Vocabulary };

export async function toVocabularyDto({
  context,
  row,
}: ToVocabularyDtoInput): Promise<VocabularyDto> {
  const values = await context.db.vocabularyValue.findMany({
    where: { vocabularyId: row.id },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    select: { id: true, vocabularyId: true, name: true, position: true },
  });
  return { ...row, values };
}

export type FindVocabularyByNameInput = { context: Db; name: string };

export const findVocabularyByName = ({ context, name }: FindVocabularyByNameInput) =>
  context.db.vocabulary.findFirst({ where: { name } });
