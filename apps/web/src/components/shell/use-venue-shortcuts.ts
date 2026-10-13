"use client";

import { useEffect, useState } from "react";
import { listVenueShortcutsAction, type VenueShortcut } from "@/features/venue/actions";

export type UseVenueShortcutsInput = { enabled: boolean };

/** Loads venues for ⌘K quick actions the first time the bar opens. */
export function useVenueShortcuts({ enabled }: UseVenueShortcutsInput): VenueShortcut[] {
  const [venues, setVenues] = useState<VenueShortcut[]>([]);
  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;
    listVenueShortcutsAction().then((result) => {
      if (!cancelled && result.ok) setVenues(result.value);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled]);
  return venues;
}
