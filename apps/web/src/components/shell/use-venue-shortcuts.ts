"use client";

import type { PermissionSet } from "@bibi/core";
import { useEffect, useState } from "react";
import { listVenueShortcutsAction, type VenueShortcut } from "@/features/venue/actions";
import { canPermission } from "@/lib/can";

export type UseVenueShortcutsInput = { enabled: boolean; permissions: PermissionSet };

/** Loads venues for ⌘K quick actions the first time the bar opens (needs `venue:read`). */
export function useVenueShortcuts({
  enabled,
  permissions,
}: UseVenueShortcutsInput): VenueShortcut[] {
  const [venues, setVenues] = useState<VenueShortcut[]>([]);
  useEffect(() => {
    if (!enabled || !canPermission({ permissions, permission: "venue:read" })) return;
    let cancelled = false;
    listVenueShortcutsAction().then((result) => {
      if (!cancelled && result.ok) setVenues(result.value);
    });
    return () => {
      cancelled = true;
    };
  }, [enabled, permissions]);
  return venues;
}
