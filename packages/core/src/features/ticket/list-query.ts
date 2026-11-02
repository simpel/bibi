import {
  TICKET_QUALIFIERS,
  TICKET_QUERY_PIECE,
  TICKET_QUERY_TOKEN,
  type TicketQualifier,
} from "./list-schema";

/** One `key:value` term: the values are alternatives (`status:Lead,Offer`); `-` negates it. */
export type TicketFilter = { key: TicketQualifier; values: string[]; negated: boolean };

export type TicketQuery = { text: string; filters: TicketFilter[] };

const qualifierOf = ({ key }: { key: string | undefined }) =>
  TICKET_QUALIFIERS.find((qualifier) => qualifier === key?.toLowerCase());

/** A value split on commas outside quotes, quotes removed, empty pieces dropped. */
const valuesOf = ({ raw }: { raw: string }) =>
  [...raw.matchAll(TICKET_QUERY_PIECE)]
    .map(([, quoted, bare]) => (quoted ?? bare ?? "").trim())
    .filter((value) => value.length > 0);

/**
 * Splits a search into qualifiers and free text. Quotes keep spaces (`customer:"Volvo Cars"`);
 * an unknown qualifier or an empty value stays free text, so a search never fails.
 */
export function parseTicketQuery({ q }: { q: string | undefined }): TicketQuery {
  const words: string[] = [];
  const filters: TicketFilter[] = [];
  for (const [whole, minus, key, value = ""] of (q ?? "").matchAll(TICKET_QUERY_TOKEN)) {
    const qualifier = qualifierOf({ key });
    const values = valuesOf({ raw: value });
    if (qualifier && values.length > 0) {
      filters.push({ key: qualifier, values, negated: minus === "-" });
    } else if (!key) {
      words.push(`${minus ?? ""}${value.replaceAll('"', "")}`);
    } else {
      words.push(whole.trim());
    }
  }
  return { text: words.join(" ").trim(), filters };
}
