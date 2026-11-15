"use client";

import { useStoredState } from "../../lib/use-stored-state";
import type { PinnedBooking } from "./pins-context";

const NONE: readonly PinnedBooking[] = [];

/**
 * The pins, kept in the tab's session storage under `key` so a reload keeps them too. A
 * convenience only: storage may be off, then pins last until the tab reloads.
 */
export function useStoredPins({ key }: { key: string | undefined }) {
  return useStoredState<readonly PinnedBooking[]>({ key, initial: NONE, storage: "session" });
}
