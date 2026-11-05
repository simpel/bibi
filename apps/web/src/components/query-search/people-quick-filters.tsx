import { Button } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { toCanonicalQuery } from "./lib/query-canonical";
import type { QueryVocabulary } from "./lib/query-vocabulary";

export type PeopleQuickFiltersProps = {
  /** The list page the toggles link to, e.g. `ROUTES.orders`. */
  pathname: string;
  /** The search in effect: the URL's, else none. */
  q: string | undefined;
  vocabulary: QueryVocabulary;
};

/** The tokens the toggles own; both on gives both, which the search reads as either. */
const ASSIGNED = "assignee:me";
const FOLLOWING = "follower:me";
const OWNED = [ASSIGNED, FOLLOWING, "involves:me"];

type Toggles = { assigned: boolean; following: boolean };

const togglesOf = ({ tokens }: { tokens: string[] }): Toggles => ({
  assigned: tokens.includes(ASSIGNED),
  following: tokens.includes(FOLLOWING),
});

const ownedTokens = ({ assigned, following }: Toggles) => [
  ...(assigned ? [ASSIGNED] : []),
  ...(following ? [FOLLOWING] : []),
];

/** A canonical token in the UI language (`involves:me` → `inblandad:jag`). */
function localToken({ token, vocabulary }: { token: string; vocabulary: QueryVocabulary }) {
  const [key = "", value = ""] = token.split(":");
  return `${vocabulary.words[key] ?? key}:${vocabulary.values[value] ?? value}`;
}

type HrefInput = { pathname: string; q: string; next: Toggles; vocabulary: QueryVocabulary };

/** The search with the toggles' tokens replaced; everything else the user typed stays as typed. */
function hrefFor({ pathname, q, next, vocabulary }: HrefInput) {
  const kept = q
    .split(/\s+/)
    .filter((token) => token && !OWNED.includes(toCanonicalQuery({ q: token, vocabulary })));
  const owned = ownedTokens(next).map((token) => localToken({ token, vocabulary }));
  const tokens = [...kept, ...owned];
  return { pathname, query: tokens.length > 0 ? { q: tokens.join(" ") } : {} };
}

/**
 * All, Assigned to me and Following on every list with people filters (orders, run sheets). The last two are independent toggles (both on is two filters,
 * assignee or follower); All switches both off. A toggle is lit whichever language the search
 * was typed in.
 */
export async function PeopleQuickFilters({
  pathname,
  q = "",
  vocabulary,
}: PeopleQuickFiltersProps) {
  const t = await getTranslations("assignment.filter");
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
          <Link href={hrefFor({ pathname, q, next, vocabulary })} aria-pressed={pressed}>
            {t(key)}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
