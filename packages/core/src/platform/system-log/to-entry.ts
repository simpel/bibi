import type { SystemLog } from "@bibi/db";
import type { SystemLogEntry } from "./schema";

export type ToEntryInput = { row: SystemLog };

/** `data` is always a JSON object as written by the sink; anything else is wrapped. */
export function toEntry({ row }: ToEntryInput): SystemLogEntry {
  const { data } = row;
  const isObject = typeof data === "object" && data !== null && !Array.isArray(data);
  return { ...row, data: isObject ? (data as Record<string, unknown>) : { value: data } };
}
