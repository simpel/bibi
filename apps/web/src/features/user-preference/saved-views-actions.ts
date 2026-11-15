"use server";

import { appError, fromZodError, setUserPreference, type UserPreferenceDto } from "@bibi/core";
import { type SavedView, SavedViewsSchema } from "@bibi/core/schemas";
import {
  SAVED_VIEW_LISTS,
  type SavedViewListId,
  savedViewsKey,
} from "@/components/saved-views/lib/saved-views";
import type { ActionResult } from "@/lib/action-result";
import { runOperation } from "@/server/run-operation";
import { getSessionState } from "@/server/session";
import { toActionResult } from "@/server/to-action-result";

export type SaveSavedViewsInput = {
  listId: SavedViewListId;
  /** The list's views in order; `null` puts back the built-in ones. */
  views: SavedView[] | null;
};

/** Saves the member's views above one list in the active organization (a user preference). */
export async function saveSavedViewsAction({
  listId,
  views,
}: SaveSavedViewsInput): Promise<ActionResult<UserPreferenceDto>> {
  const state = await getSessionState();
  if (!SAVED_VIEW_LISTS.includes(listId)) {
    const error = appError({ code: "VALIDATION", message: "Unknown list" });
    return toActionResult({ result: { ok: false, error } });
  }
  if (state.status !== "ready") {
    const error = appError({ code: "UNAUTHENTICATED", message: "Not signed in" });
    return toActionResult({ result: { ok: false, error } });
  }
  const parsed = views === null ? null : SavedViewsSchema.safeParse(views);
  if (parsed && !parsed.success) {
    return toActionResult({ result: { ok: false, error: fromZodError({ error: parsed.error }) } });
  }
  const key = savedViewsKey({ organizationId: state.organizationId, listId });
  const result = await runOperation({
    operation: setUserPreference,
    input: { key, value: parsed?.data ?? null },
  });
  return toActionResult({ result });
}
