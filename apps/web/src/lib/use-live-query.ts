import { useEffect, useRef, useState } from "react";
import type { ActionResult } from "./action-result";
import { LIVE_QUERY_IDLE, type LiveQueryState, lastValue, settle } from "./live-query-state";

export type UseLiveQueryInput<I, T> = {
  /** `null` asks nothing (idle). Compared by value, so an equal new object does not load again. */
  input: I | null;
  /** A server action; the latest one is called, so it need not be stable. */
  load: (input: I) => Promise<ActionResult<T>>;
  /** Wait this long after the input stops changing (typing); 0 loads at once. */
  waitMs?: number;
};

/**
 * The answer for input the user is still changing (a typeahead, a live check, a preview): loads
 * again when the input changes, and an answer to an older input is dropped. The one place in the
 * web app where an effect fetches; everything else is read on the server (apps/web/CLAUDE.md).
 */
export function useLiveQuery<I, T>({
  input,
  load,
  waitMs = 0,
}: UseLiveQueryInput<I, T>): LiveQueryState<T> {
  const [state, setState] = useState<LiveQueryState<T>>(LIVE_QUERY_IDLE);
  const key = input === null ? null : JSON.stringify(input);
  const latest = useRef({ input, load });
  latest.current = { input, load };
  const calls = useRef(0);
  // Server: a live answer for the input, once it has stopped changing for `waitMs`.
  useEffect(() => {
    const call = ++calls.current;
    const { input: current } = latest.current;
    if (key === null || current === null) {
      setState(LIVE_QUERY_IDLE);
      return;
    }
    setState((before) => ({ status: "loading", previous: lastValue({ state: before }) }));
    const timer = setTimeout(async () => {
      const next = await settle({ input: current, load: latest.current.load });
      if (call === calls.current) setState(next);
    }, waitMs);
    return () => clearTimeout(timer);
  }, [key, waitMs]);
  return state;
}
