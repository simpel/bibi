"use client";

import { useEffect, useRef, useState } from "react";

const BATCH = 30;

export type UseInfiniteRowsInput<TRow> = {
  rows: readonly TRow[];
  /** false: every row at once. */
  enabled?: boolean;
};

/** The first rows, and more as the `end` marker below the table scrolls into view. */
export function useInfiniteRows<TRow>({ rows, enabled = true }: UseInfiniteRowsInput<TRow>) {
  const [shown, setShown] = useState(BATCH);
  const end = useRef<HTMLDivElement>(null);
  const visible = enabled ? rows.slice(0, shown) : rows;
  const more = enabled && shown < rows.length;
  // Syncs with the browser: load the next batch when the end of the table scrolls into view.
  // Re-observing after each batch loads more at once while the end is still on screen.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `shown` re-runs the observer
  useEffect(() => {
    const node = end.current;
    if (!node || !more) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting) setShown((count) => count + BATCH);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, [more, shown]);
  return { rows: visible, end, more };
}
