"use client";

import { useEffect, useState } from "react";
import type { PinnedBooking } from "./pins-context";

const read = ({ key }: { key: string }): PinnedBooking[] => {
  try {
    const value = window.sessionStorage.getItem(key);
    return value ? (JSON.parse(value) as PinnedBooking[]) : [];
  } catch {
    return [];
  }
};

/**
 * The pins, kept in the tab's session storage under `key` so a reload keeps them too. A
 * convenience only: storage may be off, then pins last until the tab reloads.
 */
export function useStoredPins({ key }: { key: string | undefined }) {
  const [pins, setPins] = useState<readonly PinnedBooking[]>([]);
  const [loaded, setLoaded] = useState(false);
  useEffect(() => {
    if (key) setPins(read({ key }));
    setLoaded(true);
  }, [key]);
  useEffect(() => {
    if (!key || !loaded) return;
    try {
      window.sessionStorage.setItem(key, JSON.stringify(pins));
    } catch {
      // Storage off or full: the pins still work for this page's life.
    }
  }, [key, loaded, pins]);
  return [pins, setPins] as const;
}
