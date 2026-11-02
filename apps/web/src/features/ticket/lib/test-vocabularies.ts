import en from "@bibi/i18n/messages/en.json";
import sv from "@bibi/i18n/messages/sv.json";
import type { QueryVocabulary } from "./query-vocabulary";

const of = ({ query }: { query: typeof sv.ticket.query }): QueryVocabulary => ({
  words: query.keys,
  values: query.values,
  empty: query.empty,
});

/** The search words as the app ships them, for tests. */
export const EN_VOCABULARY = of({ query: en.ticket.query });
export const SV_VOCABULARY = of({ query: sv.ticket.query });
