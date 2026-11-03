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

/** The tokens the toggles own: both on is `involves:me` (assignee or follower). */
const ASSIGNED = "assignee:me";
const FOLLOWING = "follower:me";
const BOTH = "involves:me";
const OWNED = [ASSIGNED, FOLLOWING, BOTH];

type Toggles = { assigned: boolean; following: boolean };

const togglesOf = ({ tokens }: { tokens: string[] }): Toggles => ({
  assigned: tokens.includes(ASSIGNED) || tokens.includes(BOTH),
  following: tokens.includes(FOLLOWING) || tokens.includes(BOTH),
});

function ownedToken({ assigned, following }: Toggles) {
  if (assigned && following) return BOTH;
  return assigned ? ASSIGNED : following ? FOLLOWING : null;
}

/** A canonical token in the UI language (`involves:me` → `inblandad:jag`). */
function localToken({ token, vocabulary }: { token: string; vocabulary: QueryVocabulary }) {
  const [key = "", value = ""] = token.split(":");
  return `${vocabulary.words[key] ?? key}:${vocabulary.values[value] ?? value}`;
}

type HrefInput = { q: string; next: Toggles; vocabulary: QueryVocabulary };

/** The search with the toggles' tokens replaced; everything else the user typed stays as typed. */
function hrefFor({ q, next, vocabulary }: HrefInput) {
  const kept = q
    .split(/\s+/)
    .filter((token) => token && !OWNED.includes(toCanonicalQuery({ q: token, vocabulary })));
  const owned = ownedToken(next);
  const tokens = owned ? [...kept, localToken({ token: owned, vocabulary })] : kept;
  return { pathname: ROUTES.workOrders, query: tokens.length > 0 ? { q: tokens.join(" ") } : {} };
}

/**
 * All, Assigned to me and Following. The last two are independent toggles (both on means
 * assignee or follower); All switches both off. A toggle is lit whichever language the search
 * was typed in.
 */
export async function WorkOrderQuickFilters({ q, vocabulary }: WorkOrderQuickFiltersProps) {
  const t = await getTranslations("workOrder.list.filter");
  const tokens = toCanonicalQuery({ q, vocabulary }).split(/\s+/);
  const on = togglesOf({ tokens });
  const buttons = [
    {
      key: "all",
      pressed: !on.assigned && !on.following,
      next: { assigned: false, following: false },
    },
    { key: "assigned", pressed: on.assigned, next: { ...on, assigned: !on.assigned } },
    { key: "following", pressed: on.following, next: { ...on, following: !on.following } },
  ] as const;
  return (
    <nav className="flex flex-wrap gap-2" aria-label={t("label")}>
      {buttons.map(({ key, pressed, next }) => (
        <Button key={key} asChild size="sm" variant={pressed ? "secondary" : "ghost"}>
          <Link href={hrefFor({ q, next, vocabulary })} aria-pressed={pressed}>
            {t(key)}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
