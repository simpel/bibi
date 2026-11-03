import type { ActionResult } from "./action-result";
import { type ErrorKey, errorKeyForCode } from "./error-key";

/** A live query's answer; `loading` keeps the last value so the UI need not blank out. */
export type LiveQueryState<T> =
  | { status: "idle" }
  | { status: "loading"; previous: T | null }
  | { status: "error"; errorKey: ErrorKey }
  | { status: "ready"; value: T };

export const LIVE_QUERY_IDLE = { status: "idle" } as const;

/** The value a state holds or held: kept while loading, dropped after idle or an error. */
export function lastValue<T>({ state }: { state: LiveQueryState<T> }): T | null {
  if (state.status === "ready") return state.value;
  return state.status === "loading" ? state.previous : null;
}

export type SettleInput<I, T> = { input: I; load: (input: I) => Promise<ActionResult<T>> };

/** One call as a state: a failed result is its error key, a thrown call the network error. */
export async function settle<I, T>({ input, load }: SettleInput<I, T>): Promise<LiveQueryState<T>> {
  try {
    const result = await load(input);
    if (result.ok) return { status: "ready", value: result.value };
    return { status: "error", errorKey: errorKeyForCode(result.error) };
  } catch {
    return { status: "error", errorKey: "network" };
  }
}
