import { TICKET_MEASURES } from "./list-measures";

/** Qualifiers on names and people. */
export const TICKET_NAME_QUALIFIERS = [
  "assignee",
  "follower",
  "status",
  "type",
  "customer",
  "contact",
  "is",
] as const;

/** Qualifiers `ticket.list`'s `q` understands, GitHub style (`assignee:me -status:Lost`). */
export const TICKET_QUALIFIERS = [...TICKET_NAME_QUALIFIERS, ...TICKET_MEASURES] as const;

export type TicketQualifier = (typeof TICKET_QUALIFIERS)[number];

/** One `key:value` term: the values are alternatives (`status:Lead,Offer`); `-` negates it. */
export type TicketFilter = { key: TicketQualifier; values: string[]; negated: boolean };

export type TicketQuery = { text: string; filters: TicketFilter[] };

const TOKEN = /(-)?(?:([a-z]+):)?(?:"([^"]*)"?|(\S+))/gi;

const qualifierOf = ({ key }: { key: string | undefined }) =>
  TICKET_QUALIFIERS.find((qualifier) => qualifier === key?.toLowerCase());

const valuesOf = ({ raw }: { raw: string }) =>
  raw
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

/**
 * Splits a search into qualifiers and free text. Quotes keep spaces (`customer:"Volvo Cars"`);
 * an unknown qualifier or an empty value stays free text, so a search never fails.
 */
export function parseTicketQuery({ q }: { q: string | undefined }): TicketQuery {
  const words: string[] = [];
  const filters: TicketFilter[] = [];
  for (const match of (q ?? "").matchAll(TOKEN)) {
    const [whole, minus, key, quoted, bare] = match;
    const qualifier = qualifierOf({ key });
    const values = valuesOf({ raw: quoted ?? bare ?? "" });
    if (qualifier && values.length > 0) {
      filters.push({ key: qualifier, values, negated: minus === "-" });
    } else if (quoted !== undefined && !key) {
      words.push(`${minus ?? ""}${quoted}`);
    } else if (whole.trim()) {
      words.push(whole.trim());
    }
  }
  return { text: words.join(" ").trim(), filters };
}
