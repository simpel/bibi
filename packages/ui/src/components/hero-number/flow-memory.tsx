"use client";

import { createContext, type ReactNode, useContext, useEffect, useState } from "react";

const FlowMemoryContext = createContext<Map<string, number> | null>(null);

/**
 * Remembers the last value of each keyed animated number below it. Place it in a layout above a
 * route segment that remounts when a filter in the URL changes (a period in the path, a query),
 * so the new page's numbers animate from the old ones instead of appearing.
 */
export function FlowMemory({ children }: { children: ReactNode }) {
  const [memory] = useState(() => new Map<string, number>());
  return <FlowMemoryContext.Provider value={memory}>{children}</FlowMemoryContext.Provider>;
}

export type RememberedValueInput = { key: string | undefined; value: number };

/**
 * The value to draw: on mount the one `FlowMemory` last saw under `key`, then `value`, so a
 * NumberFlow animates across a remount. Without a key or a `FlowMemory` it is just `value`.
 */
export function useRememberedValue({ key, value }: RememberedValueInput): number {
  const memory = useContext(FlowMemoryContext);
  const [shown, setShown] = useState(() => (key ? memory?.get(key) : undefined) ?? value);
  useEffect(() => {
    setShown(value);
    if (key) memory?.set(key, value);
  }, [key, value, memory]);
  return shown;
}
