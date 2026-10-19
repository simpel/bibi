import { ok } from "../../errors/result";
import { defineOperation } from "../../operations/define-operation";
import { notFound } from "../../shared/errors";
import { pageArgs } from "../../shared/page-input";
import { paginate } from "../../shared/paginate";
import { loadVocabulary, toVocabularyDtos } from "./load-vocabulary";
import {
  VocabularyIdInputSchema,
  VocabularyListInputSchema,
  VocabularyListOutputSchema,
  VocabularySchema,
} from "./schema";

export const listVocabularies = defineOperation({
  name: "vocabulary.list",
  kind: "query",
  description:
    "List the organization's own word lists (e.g. Allergener, Kost, Hamn) with their values. " +
    "Choice fields and requirements pick values from these lists.",
  input: VocabularyListInputSchema,
  output: VocabularyListOutputSchema,
  permission: "configuration:view",
  handler: async ({ input, context }) => {
    const rows = await context.db.vocabulary.findMany({
      orderBy: [{ name: "asc" }, { id: "asc" }],
      ...pageArgs(input),
    });
    const page = paginate({ rows, limit: input.limit });
    const items = await toVocabularyDtos({ context, rows: page.items });
    return ok({ value: { items, nextCursor: page.nextCursor } });
  },
});

export const getVocabulary = defineOperation({
  name: "vocabulary.get",
  kind: "query",
  description: "Get one list by id, with its active values in order.",
  input: VocabularyIdInputSchema,
  output: VocabularySchema,
  permission: "configuration:view",
  handler: async ({ input, context }) => {
    const vocabulary = await loadVocabulary({ context, id: input.id });
    return vocabulary ? ok({ value: vocabulary }) : notFound({ entity: "List" });
  },
});
