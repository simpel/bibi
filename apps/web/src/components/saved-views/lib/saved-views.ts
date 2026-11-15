import { type SavedView, type SavedViewDefault, SavedViewsSchema } from "@bibi/core/schemas";
import { toCanonicalQuery } from "@/components/query-search/lib/query-canonical";
import type { QueryVocabulary } from "@/components/query-search/lib/query-vocabulary";

/** The lists that keep views; the id is part of the preference key. */
export const SAVED_VIEW_LISTS = ["orders", "run-sheets", "my-work"] as const;

export type SavedViewListId = (typeof SAVED_VIEW_LISTS)[number];

/** The preference key of one list's views in one organization (a query names its statuses). */
export const savedViewsKey = ({
  organizationId,
  listId,
}: {
  organizationId: string;
  listId: SavedViewListId;
}) => `views.${organizationId.toLowerCase()}.${listId}`;

/** A view's stable key in the bar: `default:all` or the saved view's id. */
export const viewKeyOf = ({ view }: { view: SavedView }) =>
  "default" in view ? `default:${view.default}` : view.id;

type ReadInput = { stored: unknown; defaults: readonly SavedViewDefault[] };

/** The stored views, without built-in ones this list does not offer; none stored → defaults. */
export function readSavedViews({ stored, defaults }: ReadInput): SavedView[] {
  const parsed = SavedViewsSchema.safeParse(stored);
  if (stored === null || stored === undefined || !parsed.success) {
    return defaults.map((name) => ({ default: name }));
  }
  return parsed.data.filter((view) => !("default" in view) || defaults.includes(view.default));
}

/** The built-in views of lists with people filters (orders, run sheets). */
export const PEOPLE_VIEWS = [
  "all",
  "assigned",
  "following",
] as const satisfies readonly SavedViewDefault[];

/** The canonical tokens the built-in views search for (`all` is no search). */
const DEFAULT_QUERIES: Record<SavedViewDefault, string> = {
  all: "",
  assigned: "assignee:me",
  following: "follower:me",
};

/** A canonical token in the UI language (`assignee:me` → `ansvarig:jag`). */
function localToken({ token, vocabulary }: { token: string; vocabulary: QueryVocabulary }) {
  if (!token) return token;
  const [key = "", value = ""] = token.split(":");
  return `${vocabulary.words[key] ?? key}:${vocabulary.values[value] ?? value}`;
}

/** The search a view opens, in the UI language for built-in ones. */
export function queryOf({ view, vocabulary }: { view: SavedView; vocabulary: QueryVocabulary }) {
  if (!("default" in view)) return view.q;
  return localToken({ token: DEFAULT_QUERIES[view.default], vocabulary });
}

/** The search as compared: canonical words, one space between tokens, case-insensitive. */
export function comparableQuery({ q, vocabulary }: { q: string; vocabulary: QueryVocabulary }) {
  return toCanonicalQuery({ q: q.trim(), vocabulary }).split(/\s+/).join(" ").toLowerCase();
}

type ActiveInput = { views: readonly SavedView[]; q: string; vocabulary: QueryVocabulary };

/** The first view whose search is the one in effect, if any. */
export function activeViewOf({ views, q, vocabulary }: ActiveInput): SavedView | undefined {
  const current = comparableQuery({ q, vocabulary });
  return views.find(
    (view) => comparableQuery({ q: queryOf({ view, vocabulary }), vocabulary }) === current,
  );
}

/** The views with a new one last. */
export const addView = ({
  views,
  view,
}: {
  views: readonly SavedView[];
  view: { id: string; name: string; q: string };
}): SavedView[] => [...views, view];

/** The views with one saved view renamed. */
export const renameView = ({
  views,
  key,
  name,
}: {
  views: readonly SavedView[];
  key: string;
  name: string;
}): SavedView[] =>
  views.map((view) => ("default" in view || view.id !== key ? view : { ...view, name }));

/** The views without one (a saved one is gone; a built-in one is hidden until reset). */
export const removeView = ({
  views,
  key,
}: {
  views: readonly SavedView[];
  key: string;
}): SavedView[] => views.filter((view) => viewKeyOf({ view }) !== key);
