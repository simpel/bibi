import { Link } from "@okazi/i18n/navigation";
import { Button } from "@okazi/ui";
import { getTranslations } from "next-intl/server";

export type CursorPaginationProps = {
  pathname: string;
  /** Cursor of the current page; undefined on the first page. */
  cursor?: string | undefined;
  nextCursor: string | null;
  /** Query-string name of the cursor, e.g. `cursor` or `roomCursor`. */
  param?: string;
};

/** Cursor pagination: "first page" when deep, "next" when more rows exist (no page numbers). */
export async function CursorPagination({
  pathname,
  cursor,
  nextCursor,
  param = "cursor",
}: CursorPaginationProps) {
  const t = await getTranslations("common");
  if (!cursor && !nextCursor) return null;
  return (
    <nav className="flex justify-end gap-2" aria-label={t("nextPage")}>
      {cursor ? (
        <Button asChild variant="outline" size="sm">
          <Link href={pathname}>{t("firstPage")}</Link>
        </Button>
      ) : null}
      {nextCursor ? (
        <Button asChild variant="outline" size="sm">
          <Link href={{ pathname, query: { [param]: nextCursor } }}>{t("nextPage")}</Link>
        </Button>
      ) : null}
    </nav>
  );
}
