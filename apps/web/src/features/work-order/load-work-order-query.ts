import { getMessages } from "next-intl/server";
import { buildWorkOrderQuery } from "./lib/work-order-query";

/** The work orders search's words and dropdown texts in the request's language. */
export async function loadWorkOrderQuery(): Promise<ReturnType<typeof buildWorkOrderQuery>> {
  return buildWorkOrderQuery({ messages: await getMessages() });
}
