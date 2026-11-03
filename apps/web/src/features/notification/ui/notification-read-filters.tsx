import { Button } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";
import type { NotificationListParams } from "../lib/list-params";

const SHORTCUTS = [
  { key: "all", read: undefined },
  { key: "unread", read: "unread" },
  { key: "read", read: "read" },
] as const;

export type NotificationReadFiltersProps = Pick<NotificationListParams, "read" | "kind" | "q">;

/** All, Unread and Read as links that keep the search and kind; the active one is lit. */
export async function NotificationReadFilters({ read, kind, q }: NotificationReadFiltersProps) {
  const t = await getTranslations("notifications.filter");
  const kept = { ...(kind ? { kind } : {}), ...(q ? { q } : {}) };
  return (
    <nav className="flex flex-wrap gap-2" aria-label={t("label")}>
      {SHORTCUTS.map((shortcut) => (
        <Button
          key={shortcut.key}
          asChild
          size="sm"
          variant={shortcut.read === read ? "secondary" : "ghost"}
        >
          <Link
            href={{
              pathname: ROUTES.notifications,
              query: { ...kept, ...(shortcut.read ? { read: shortcut.read } : {}) },
            }}
          >
            {t(shortcut.key)}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
