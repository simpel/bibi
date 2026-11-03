import { Button } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";

const SHORTCUTS = [
  { key: "all", read: undefined },
  { key: "unread", read: "unread" },
  { key: "read", read: "read" },
] as const;

export type ReadFilterTabsProps = {
  pathname: string;
  read: "unread" | "read" | undefined;
  /** The other filters (search, kind, channel) kept on every link. */
  keep: Record<string, string>;
};

/** All, Unread and Read as links that keep the other filters; the active one is lit. */
export async function ReadFilterTabs({ pathname, read, keep }: ReadFilterTabsProps) {
  const t = await getTranslations("common.readFilter");
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
              pathname,
              query: { ...keep, ...(shortcut.read ? { read: shortcut.read } : {}) },
            }}
          >
            {t(shortcut.key)}
          </Link>
        </Button>
      ))}
    </nav>
  );
}
