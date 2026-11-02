import { TICKET_EMPTY_FIELDS, TICKET_QUALIFIERS } from "@bibi/core/schemas";
import { getTranslations } from "next-intl/server";
import { QUERY_FIXED_VALUES, type QueryVocabulary } from "./lib/query-vocabulary";

const record = <K extends string>({
  keys,
  word,
}: {
  keys: readonly K[];
  word: (key: K) => string;
}) => Object.fromEntries(keys.map((key) => [key, word(key)])) as Record<K, string>;

/** The tickets search's words in the request's language (`ticket.query`). */
export async function loadQueryVocabulary(): Promise<QueryVocabulary> {
  const t = await getTranslations("ticket.query");
  return {
    words: record({ keys: TICKET_QUALIFIERS, word: (key) => t(`keys.${key}`) }),
    values: record({ keys: QUERY_FIXED_VALUES, word: (key) => t(`values.${key}`) }),
    empty: record({ keys: TICKET_EMPTY_FIELDS, word: (key) => t(`empty.${key}`) }),
  };
}
