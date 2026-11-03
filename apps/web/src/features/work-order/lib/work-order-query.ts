import { WORK_ORDER_IS_VALUES, WORK_ORDER_QUALIFIERS } from "@bibi/core/schemas";
import type Sv from "@bibi/i18n/messages/sv.json";
import type { QueryTexts } from "@/components/query-search/lib/query-suggestion-types";
import type { QuerySpec, QueryVocabulary } from "@/components/query-search/lib/query-vocabulary";

/** What `workOrder.list`'s search understands. */
export const WORK_ORDER_QUERY_SPEC: QuerySpec = {
  qualifiers: WORK_ORDER_QUALIFIERS,
  fixed: {
    assignee: ["me"],
    follower: ["me"],
    involves: ["me"],
    is: WORK_ORDER_IS_VALUES,
  },
  emptyFields: [],
};

type Messages = Pick<typeof Sv, "ticket" | "workOrder">;

/**
 * The work orders search's words and dropdown texts in one language: the ticket qualifiers
 * (`ticket.query`) are shared, the work order's own are `workOrder.query`.
 */
export function buildWorkOrderQuery({ messages: { ticket, workOrder } }: { messages: Messages }): {
  vocabulary: QueryVocabulary;
  texts: QueryTexts;
} {
  const own = workOrder.query;
  const { rows } = ticket.query;
  return {
    vocabulary: {
      ...WORK_ORDER_QUERY_SPEC,
      words: { ...ticket.query.keys, ...own.keys },
      values: { ...ticket.query.values, ...own.values },
      empty: ticket.query.empty,
    },
    texts: {
      labels: { ...ticket.query.labels, ...own.labels },
      hints: { ...ticket.qualifiers, ...own.hints },
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
