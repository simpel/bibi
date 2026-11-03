import {
  TICKET_EMPTY_FIELDS,
  TICKET_HOLDS_VALUES,
  TICKET_IS_VALUES,
  TICKET_QUALIFIERS,
} from "@bibi/core/schemas";
import type Sv from "@bibi/i18n/messages/sv.json";
import type { QueryTexts } from "@/components/query-search/lib/query-suggestion-types";
import type { QuerySpec, QueryVocabulary } from "@/components/query-search/lib/query-vocabulary";

/** What `ticket.list`'s search understands. */
export const TICKET_QUERY_SPEC: QuerySpec = {
  qualifiers: TICKET_QUALIFIERS,
  fixed: {
    assignee: ["me"],
    follower: ["me"],
    is: TICKET_IS_VALUES,
    holds: TICKET_HOLDS_VALUES,
  },
  emptyFields: TICKET_EMPTY_FIELDS,
};

type Messages = Pick<typeof Sv, "ticket">;

/** The tickets search's words and the dropdown's texts in one language (`ticket.query`). */
export function buildTicketQuery({ messages: { ticket } }: { messages: Messages }): {
  vocabulary: QueryVocabulary;
  texts: QueryTexts;
} {
  const { query } = ticket;
  return {
    vocabulary: {
      ...TICKET_QUERY_SPEC,
      words: query.keys,
      values: query.values,
      empty: query.empty,
    },
    texts: {
      labels: query.labels,
      hints: ticket.qualifiers,
      noAssignee: query.rows.noAssignee,
      hasAssignee: query.rows.hasAssignee,
      me: query.rows.me,
      exclude: { assignee: query.rows.excludeAssignee, follower: query.rows.excludeFollower },
    },
  };
}
