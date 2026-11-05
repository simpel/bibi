import { getMessages } from "next-intl/server";
import { buildRunSheetQuery } from "./lib/run-sheet-query";

/** The run sheets search's words and dropdown texts in the request's language. */
export async function loadRunSheetQuery(): Promise<ReturnType<typeof buildRunSheetQuery>> {
  return buildRunSheetQuery({ messages: await getMessages() });
}
