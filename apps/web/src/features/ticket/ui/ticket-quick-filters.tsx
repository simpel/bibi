import { Button } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { toCanonicalQuery } from "@/components/query-search/lib/query-canonical";
import type { QueryVocabulary } from "@/components/query-search/lib/query-vocabulary";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

export type TicketQuickFiltersProps = { q: string | undefined; vocabulary: QueryVocabulary };

/** Shortcuts that fill the search with a qualifier (ADR 0034: assigned or followed). */
const SHORTCUTS = [
  { key: "all", qualifier: undefined },
  { key: "assigned", qualifier: "assignee" },
  { key: "following", qualifier: "follower" },
] as const;

/**
 * All, Assigned to me and Following, as links that set the search in the UI language
 * (`ansvarig:jag`); the active one is lit, whichever language the search was typed in.
 */
export async function TicketQuickFilters({ q, vocabulary }: TicketQuickFiltersProps) {
  const t = await getTranslations("assignment.filter");
  const current = q ? toCanonicalQuery({ q, vocabulary }) : undefined;
  return (
    <nav className="flex flex-wrap gap-2" aria-label={t("label")}>
      {SHORTCUTS.map(({ key, qualifier }) => {
        const local = qualifier && `${vocabulary.words[qualifier]}:${vocabulary.values.me}`;
        const lit = qualifier ? current === `${qualifier}:me` : !current;
        return (
          <Button key={key} asChild size="sm" variant={lit ? "secondary" : "ghost"}>
            <Link href={{ pathname: ROUTES.tickets, query: local ? { q: local } : {} }}>
              {t(key)}
            </Link>
          </Button>
        );
      })}
    </nav>
  );
}
