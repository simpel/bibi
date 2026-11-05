import { getMessages } from "next-intl/server";
import { buildLogQuery } from "./lib/log-query";

type Loaded = ReturnType<typeof buildLogQuery>;

/** The log search's words and dropdown texts in the request's language. */
export async function loadLogQuery(): Promise<Loaded> {
  return buildLogQuery({ messages: await getMessages() });
}
