import "server-only";
import { getVocabulary, type Result, type VocabularyDto } from "@bibi/core";
import { cache } from "react";
import { runOperation } from "@/server/run-operation";

const loadVocabularyCached = cache(async (id: string): Promise<Result<VocabularyDto>> => {
  return runOperation({ operation: getVocabulary, input: { id } });
});

export type LoadVocabularyInput = { id: string };

/** The list by its id, cached per request so metadata and page components share one read. */
export function loadVocabulary({ id }: LoadVocabularyInput): Promise<Result<VocabularyDto>> {
  return loadVocabularyCached(id);
}
