import { getMessages } from "next-intl/server";
import { buildTicketQuery } from "./lib/ticket-query";

type Loaded = ReturnType<typeof buildTicketQuery>;

/** The tickets search's words and dropdown texts in the request's language. */
export async function loadTicketQuery(): Promise<Loaded> {
  return buildTicketQuery({ messages: await getMessages() });
}
