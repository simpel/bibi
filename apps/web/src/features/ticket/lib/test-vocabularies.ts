import en from "@bibi/i18n/messages/en.json";
import sv from "@bibi/i18n/messages/sv.json";
import type { QueryTexts } from "./query-suggestion-types";
import type { QueryVocabulary } from "./query-vocabulary";

const of = ({ query }: { query: typeof sv.ticket.query }): QueryVocabulary => ({
  words: query.keys,
  values: query.values,
  empty: query.empty,
});

/** The search words as the app ships them, for tests. */
export const EN_VOCABULARY = of({ query: en.ticket.query });
export const SV_VOCABULARY = of({ query: sv.ticket.query });

type Messages = typeof sv;

const textsOf = ({ ticket }: Pick<Messages, "ticket">): QueryTexts => ({
  labels: ticket.query.labels,
  hints: ticket.qualifiers,
  noAssignee: ticket.query.rows.noAssignee,
  hasAssignee: ticket.query.rows.hasAssignee,
  me: ticket.query.rows.me,
  exclude: {
    assignee: ticket.query.rows.excludeAssignee,
    follower: ticket.query.rows.excludeFollower,
  },
});

/** The dropdown's texts as the app ships them, for tests. */
export const EN_TEXTS = textsOf({ ticket: en.ticket });
export const SV_TEXTS = textsOf({ ticket: sv.ticket });
