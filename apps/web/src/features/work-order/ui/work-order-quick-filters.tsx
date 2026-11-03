import { Button } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { toCanonicalQuery } from "@/components/query-search/lib/query-canonical";
import type { QueryVocabulary } from "@/components/query-search/lib/query-vocabulary";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

export type WorkOrderQuickFiltersProps = {
  /** The search in effect: the URL's, else none. */
  q: string;
  vocabulary: QueryVocabulary;
};

/** All is the default search, so its link carries no query. */
const SHORTCUTS = [
  { key: "all", canonical: "" },
  { key: "mine", canonical: "involves:me" },
  { key: "assigned", canonical: "assignee:me" },
  { key: "following", canonical: "follower:me" },
] as const;

const squash = ({ q }: { q: string }) => q.trim().replace(/\s+/g, " ");

/** Words of the canonical search in the UI language (`involves:me` → `inblandad:jag`). */
function localQuery({ canonical, vocabulary }: { canonical: string; vocabulary: QueryVocabulary }) {
  return canonical
    .split(" ")
    .filter(Boolean)
    .map((token) => {
      const [key = "", value = ""] = token.split(":");
      return `${vocabulary.words[key] ?? key}:${vocabulary.values[value] ?? value}`;
    })
    .join(" ");
}

/**
 * All, Mine, Assigned to me and Following, as links that set the search in the UI
 * language; the active one is lit, whichever language the search was typed in.
 */
export async function WorkOrderQuickFilters({ q, vocabulary }: WorkOrderQuickFiltersProps) {
  const t = await getTranslations("workOrder.list.filter");
  const current = squash({ q: toCanonicalQuery({ q, vocabulary }) });
  return (
    <nav className="flex flex-wrap gap-2" aria-label={t("label")}>
      {SHORTCUTS.map(({ key, canonical }) => {
        const query = key === "all" ? {} : { q: localQuery({ canonical, vocabulary }) };
        return (
          <Button
            key={key}
            asChild
            size="sm"
            variant={current === canonical ? "secondary" : "ghost"}
          >
            <Link href={{ pathname: ROUTES.workOrders, query }}>{t(key)}</Link>
          </Button>
        );
      })}
    </nav>
  );
}
