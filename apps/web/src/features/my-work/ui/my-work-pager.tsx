import { Button } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { Link } from "@/lib/navigation";
import type { MyWorkWireish } from "./my-work-wireish";

export type MyWorkPagerProps = {
  work: Pick<MyWorkWireish, "page" | "limit" | "rowsTotal">;
  pageHref?: ((input: { page: number }) => string) | undefined;
};

/** "26–50 of 73" and links to the previous and next page of run sheet rows. */
export function MyWorkPager({ work, pageHref }: MyWorkPagerProps) {
  const t = useTranslations("myWork.pages");
  const { page, limit, rowsTotal } = work;
  if (rowsTotal <= limit && page === 1) return null;
  const pageCount = Math.max(1, Math.ceil(rowsTotal / limit));
  const first = Math.min((page - 1) * limit + 1, rowsTotal);
  const last = Math.min(page * limit, rowsTotal);
  return (
    <nav
      aria-label={t("label")}
      className="flex flex-wrap items-center justify-between gap-2 border-t pt-3"
    >
      <span className="text-sm tabular-nums text-muted-foreground">
        {t("range", { first, last, total: rowsTotal })}
      </span>
      {pageHref ? (
        <div className="flex gap-2">
          {page > 1 ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref({ page: page - 1 })}>{t("previous")}</Link>
            </Button>
          ) : null}
          {page < pageCount ? (
            <Button asChild variant="outline" size="sm">
              <Link href={pageHref({ page: page + 1 })}>{t("next")}</Link>
            </Button>
          ) : null}
        </div>
      ) : null}
    </nav>
  );
}
