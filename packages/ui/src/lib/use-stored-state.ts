"use client";

import { useCallback, useEffect, useState } from "react";

export type UseStoredStateInput<T> = {
  /** The storage key; without one the state is not kept. */
  key: string | undefined;
  initial: T;
  /** `local` outlives the tab, `session` only reloads of it. */
  storage?: "local" | "session";
};

const store = ({ storage }: { storage: "local" | "session" }) =>
  storage === "local" ? window.localStorage : window.sessionStorage;

/**
 * A per-viewer convenience kept in browser storage, so a reload keeps it (an expanded card, the
 * pins). The first render uses `initial`, then the stored value; storage that is off or full
 * only means the state lasts until the page reloads. The initial value is never written, so
 * storage holds only what differs from it.
 */
export function useStoredState<T>({ key, initial, storage = "local" }: UseStoredStateInput<T>) {
  const [value, setValue] = useState<T>(initial);
  // Browser storage: reads the kept value once the page is in the browser.
  useEffect(() => {
    if (!key) return;
    try {
      const raw = store({ storage }).getItem(key);
      if (raw !== null) setValue(JSON.parse(raw) as T);
    } catch {
      // Storage off: keep the initial value.
    }
  }, [key, storage]);
  const save = useCallback(
    (next: T | ((current: T) => T)) =>
      setValue((current) => {
        const resolved = typeof next === "function" ? (next as (c: T) => T)(current) : next;
        if (key) {
          try {
            const raw = JSON.stringify(resolved);
            if (raw === JSON.stringify(initial)) store({ storage }).removeItem(key);
            else store({ storage }).setItem(key, raw);
          } catch {
            // Storage off or full: the state still works for this page's life.
          }
        }
        return resolved;
      }),
    [key, initial, storage],
  );
  return [value, save] as const;
}
