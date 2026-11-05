import { RUN_SHEET_IS_VALUES, RUN_SHEET_QUALIFIERS } from "@bibi/core/schemas";
import type { Messages as AllMessages } from "@bibi/i18n";
import type { QueryTexts } from "@/components/query-search/lib/query-suggestion-types";
import type { QuerySpec, QueryVocabulary } from "@/components/query-search/lib/query-vocabulary";

/** What `runSheet.list`'s search understands. */
export const RUN_SHEET_QUERY_SPEC: QuerySpec = {
  qualifiers: RUN_SHEET_QUALIFIERS,
  fixed: {
    assignee: ["me"],
    follower: ["me"],
    involves: ["me"],
    is: RUN_SHEET_IS_VALUES,
  },
  emptyFields: [],
};

type Messages = Pick<AllMessages, "order" | "runSheet">;

/**
 * The run sheets search's words and dropdown texts in one language: the order qualifiers
 * (`order.query`) are shared, the run sheet's own are `runSheet.query`.
 */
export function buildRunSheetQuery({ messages: { order, runSheet } }: { messages: Messages }): {
  vocabulary: QueryVocabulary;
  texts: QueryTexts;
} {
  const own = runSheet.query;
  const { rows } = order.query;
  return {
    vocabulary: {
      ...RUN_SHEET_QUERY_SPEC,
      words: { ...order.query.keys, ...own.keys },
      values: { ...order.query.values, ...own.values },
      empty: order.query.empty,
    },
    texts: {
      labels: { ...order.query.labels, ...own.labels },
      hints: { ...order.qualifiers, ...own.hints },
      noAssignee: rows.noAssignee,
      hasAssignee: rows.hasAssignee,
      me: rows.me,
      exclude: {
        assignee: rows.excludeAssignee,
        follower: rows.excludeFollower,
        involves: own.rows.excludeInvolves,
      },
    },
  };
}
