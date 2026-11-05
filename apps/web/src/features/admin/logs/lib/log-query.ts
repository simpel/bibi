import { LOG_LEVELS } from "@bibi/core/schemas";
import type { Messages as AllMessages } from "@bibi/i18n";
import { SURFACES } from "@bibi/logger/surfaces";
import type { QueryTexts } from "@/components/query-search/lib/query-suggestion-types";
import type { QuerySpec, QueryVocabulary } from "@/components/query-search/lib/query-vocabulary";

export const LOG_QUERY_QUALIFIERS = [
  "level",
  "type",
  "surface",
  "requestId",
  "operation",
  "status",
] as const;

export const LOG_QUERY_SPEC: QuerySpec = {
  qualifiers: LOG_QUERY_QUALIFIERS,
  fixed: {
    level: LOG_LEVELS,
    type: LOG_LEVELS,
    surface: SURFACES,
  },
  emptyFields: [],
};

type Messages = Pick<AllMessages, "admin">;

/** The system log search's words and suggestion texts in one language. */
export function buildLogQuery({ messages: { admin } }: { messages: Messages }): {
  vocabulary: QueryVocabulary;
  texts: QueryTexts;
} {
  const { query } = admin.logs;
  return {
    vocabulary: {
      ...LOG_QUERY_SPEC,
      words: query.keys,
      values: query.values,
      empty: {},
    },
    texts: {
      labels: query.labels,
      hints: query.hints,
      noAssignee: "",
      hasAssignee: "",
      me: "",
      exclude: {},
    },
  };
}
