import type { SavedViewDefault } from "@bibi/core/schemas";
import { getTranslations } from "next-intl/server";
import { loadSavedViews } from "@/features/user-preference/saved-views-load";
import type { QueryVocabulary } from "../query-search/lib/query-vocabulary";
import { activeViewOf, queryOf, type SavedViewListId, viewKeyOf } from "./lib/saved-views";
import { type SavedViewEntry, SavedViewsBar } from "./saved-views-bar";

export type SavedViewsProps = {
  listId: SavedViewListId;
  /** The built-in views this list offers, in their default order. */
  defaults: readonly SavedViewDefault[];
  /** The page the views link to (the list's path, or My work's current range). */
  pathname: string;
  /** The search in effect. */
  q: string | undefined;
  vocabulary: QueryVocabulary;
};

/**
 * The member's views left of a list's search: built-in ones (All, Assigned to me, Following)
 * and searches they saved. A view links to its search and is lit when that is the search in
 * effect; the menu saves the current search, renames or removes the lit view, or resets.
 */
export async function SavedViews({
  listId,
  defaults,
  pathname,
  q = "",
  vocabulary,
}: SavedViewsProps) {
  const [t, views] = await Promise.all([
    getTranslations("assignment.filter"),
    loadSavedViews({ listId, defaults }),
  ]);
  const active = activeViewOf({ views, q, vocabulary });
  const entries: SavedViewEntry[] = views.map((view) => {
    const search = queryOf({ view, vocabulary });
    const query: Record<string, string> = search ? { q: search } : {};
    return {
      key: viewKeyOf({ view }),
      label: "default" in view ? t(view.default) : view.name,
      href: { pathname, query },
      active: view === active,
      saved: !("default" in view),
    };
  });
  return (
    <SavedViewsBar
      listId={listId}
      views={views}
      entries={entries}
      unsavedQuery={!active && q.trim() ? q.trim() : null}
    />
  );
}
