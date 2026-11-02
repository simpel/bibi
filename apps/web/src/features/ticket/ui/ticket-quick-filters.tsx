import { Button } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

/** Shortcuts that fill the search with a qualifier (ADR 0034: assigned or followed). */
const SHORTCUTS = [
  { key: "all", q: undefined },
  { key: "assigned", q: "assignee:me" },
  { key: "following", q: "follower:me" },
] as const;

/** All, Assigned to me and Following, as links that set the search; the active one is lit. */
export async function TicketQuickFilters({ q }: { q: string | undefined }) {
  const t = await getTranslations("assignment.filter");
  return (
    <nav className="flex flex-wrap gap-2" aria-label={t("label")}>
      {SHORTCUTS.map(({ key, q: shortcut }) => (
        <Button
          key={key}
          asChild
          size="sm"
          variant={shortcut === q || (!shortcut && !q) ? "secondary" : "ghost"}
        >
          <Link href={{ pathname: ROUTES.tickets, query: shortcut ? { q: shortcut } : {} }}>
            {t(key)}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
