import "server-only";
import type { SavedView, SavedViewDefault } from "@bibi/core/schemas";
import {
  readSavedViews,
  type SavedViewListId,
  savedViewsKey,
} from "@/components/saved-views/lib/saved-views";
import { getSessionState } from "@/server/session";
import { loadUserPreferences } from "./load";

export type LoadSavedViewsInput = {
  listId: SavedViewListId;
  /** The built-in views this list offers, in their default order. */
  defaults: readonly SavedViewDefault[];
};

/**
 * The signed-in member's views above one list in the active organization (a user preference).
 * Like every preference a convenience: without a session or on error, the built-in views.
 */
export async function loadSavedViews({
  listId,
  defaults,
}: LoadSavedViewsInput): Promise<SavedView[]> {
  const state = await getSessionState();
  if (state.status !== "ready") return readSavedViews({ stored: null, defaults });
  const key = savedViewsKey({ organizationId: state.organizationId, listId });
  const preferences = await loadUserPreferences({ prefix: key });
  return readSavedViews({ stored: preferences[key] ?? null, defaults });
}
