"use server";

import {
  addVocabularyValue,
  archiveVocabulary,
  archiveVocabularyValue,
  createVocabulary,
  importVocabularyTemplate,
  updateVocabulary,
  updateVocabularyValue,
  type VocabularyCreateInput,
  type VocabularyDto,
} from "@bibi/core";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { toActionResult } from "@/server/to-action-result";

export type CreateVocabularyActionInput = { input: VocabularyCreateInput };
export type RenameVocabularyActionInput = { id: string; name: string };
export type ArchiveVocabularyActionInput = { id: string };
export type AddValueActionInput = { vocabularyId: string; name: string };
export type RenameValueActionInput = { id: string; name: string };
export type ArchiveValueActionInput = { id: string };

export async function createVocabularyAction({
  input,
}: CreateVocabularyActionInput): Promise<ActionResult<VocabularyDto>> {
  return toActionResult({ result: await runOperation({ operation: createVocabulary, input }) });
}

export async function renameVocabularyAction({
  id,
  name,
}: RenameVocabularyActionInput): Promise<ActionResult<VocabularyDto>> {
  const input = { id, name };
  return toActionResult({ result: await runOperation({ operation: updateVocabulary, input }) });
}

export async function archiveVocabularyAction({
  id,
}: ArchiveVocabularyActionInput): Promise<ActionResult<VocabularyDto>> {
  const input = { id };
  return toActionResult({ result: await runOperation({ operation: archiveVocabulary, input }) });
}

/** Imports the "EU:s 14 allergener" list template as an ordinary, editable list. */
export async function importAllergensAction(): Promise<ActionResult<VocabularyDto>> {
  const input = { template: "eu-14-allergens" } as const;
  return toActionResult({
    result: await runOperation({ operation: importVocabularyTemplate, input }),
  });
}

export async function addValueAction({ vocabularyId, name }: AddValueActionInput) {
  const input = { vocabularyId, name };
  return toActionResult({ result: await runOperation({ operation: addVocabularyValue, input }) });
}

export async function renameValueAction({ id, name }: RenameValueActionInput) {
  const input = { id, name };
  return toActionResult({
    result: await runOperation({ operation: updateVocabularyValue, input }),
  });
}

export async function archiveValueAction({ id }: ArchiveValueActionInput) {
  const input = { id };
  return toActionResult({
    result: await runOperation({ operation: archiveVocabularyValue, input }),
  });
}
