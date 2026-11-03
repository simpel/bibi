import { type ParsedQuery, parseQuery, type QueryFilter } from "../../shared/query/parse-query";
import { TICKET_QUALIFIERS, type TicketQualifier } from "./list-schema";

/** One `key:value` term of a ticket search. */
export type TicketFilter = QueryFilter<TicketQualifier>;

export type TicketQuery = ParsedQuery<TicketQualifier>;

/** Splits a ticket search into its qualifiers and free text (see `parseQuery`). */
export const parseTicketQuery = ({ q }: { q: string | undefined }): TicketQuery =>
  parseQuery({ q, qualifiers: TICKET_QUALIFIERS });
