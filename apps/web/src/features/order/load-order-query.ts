import { getMessages } from "next-intl/server";
import { buildOrderQuery } from "./lib/order-query";

type Loaded = ReturnType<typeof buildOrderQuery>;

/** The orders search's words and dropdown texts in the request's language. */
export async function loadOrderQuery(): Promise<Loaded> {
  return buildOrderQuery({ messages: await getMessages() });
}
