import { type ParsedQuery, parseQuery, type QueryFilter } from "../../shared/query/parse-query";
import { ORDER_QUALIFIERS, type OrderQualifier } from "./list-schema";

/** One `key:value` term of an order search. */
export type OrderFilter = QueryFilter<OrderQualifier>;

export type OrderQuery = ParsedQuery<OrderQualifier>;

/** Splits an order search into its qualifiers and free text (see `parseQuery`). */
export const parseOrderQuery = ({ q }: { q: string | undefined }): OrderQuery =>
  parseQuery({ q, qualifiers: ORDER_QUALIFIERS });
