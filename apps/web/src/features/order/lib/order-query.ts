import {
  ORDER_EMPTY_FIELDS,
  ORDER_HOLDS_VALUES,
  ORDER_IS_VALUES,
  ORDER_QUALIFIERS,
} from "@bibi/core/schemas";
import type { Messages as AllMessages } from "@bibi/i18n";
import type { QueryTexts } from "@/components/query-search/lib/query-suggestion-types";
import type { QuerySpec, QueryVocabulary } from "@/components/query-search/lib/query-vocabulary";

/** What `order.list`'s search understands. */
export const ORDER_QUERY_SPEC: QuerySpec = {
  qualifiers: ORDER_QUALIFIERS,
  fixed: {
    assignee: ["me"],
    follower: ["me"],
    is: ORDER_IS_VALUES,
    holds: ORDER_HOLDS_VALUES,
  },
  emptyFields: ORDER_EMPTY_FIELDS,
};

type Messages = Pick<AllMessages, "order">;

/** The orders search's words and the dropdown's texts in one language (`order.query`). */
export function buildOrderQuery({ messages: { order } }: { messages: Messages }): {
  vocabulary: QueryVocabulary;
  texts: QueryTexts;
} {
  const { query } = order;
  return {
    vocabulary: {
      ...ORDER_QUERY_SPEC,
      words: query.keys,
      values: query.values,
      empty: query.empty,
    },
    texts: {
      labels: query.labels,
      hints: order.qualifiers,
      noAssignee: query.rows.noAssignee,
      hasAssignee: query.rows.hasAssignee,
      me: query.rows.me,
      exclude: { assignee: query.rows.excludeAssignee, follower: query.rows.excludeFollower },
    },
  };
}
