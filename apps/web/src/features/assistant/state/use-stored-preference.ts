"use client";

import { useCallback, useEffect, useState } from "react";

export type UseStoredPreferenceInput<T> = {
  key: string;
  initial: T;
  parse: (input: { raw: string }) => T | null;
};

/**
 * A per-viewer convenience kept in localStorage (panel open/width). Starts with `initial` so
 * server and client render the same, then restores. Storage may be blocked: all access is guarded.
 */
export function useStoredPreference<T>({ key, initial, parse }: UseStoredPreferenceInput<T>) {
  const [value, setValue] = useState<T>(initial);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      const restored = raw === null ? null : parse({ raw });
      if (restored !== null) setValue(restored);
    } catch {
      // Storage unavailable: keep the default.
    }
  }, [key, parse]);
  const update = useCallback(
    ({ next }: { next: T }) => {
      setValue(next);
      try {
        window.localStorage.setItem(key, String(next));
      } catch {
        // Storage unavailable: the choice only lasts for this page view.
      }
    },
    [key],
  );
  return [value, update] as const;
}
