import { Button } from "@bibi/ui";
import { getTranslations } from "next-intl/server";
import { Link } from "@/lib/navigation";
import { ROUTES } from "@/lib/routes";

export type OrganizationPagerProps = { cursor: string | undefined; nextCursor: string | null };

/** Cursor paging of the organizations list: back to the first page, or on to the next. */
export async function OrganizationPager({ cursor, nextCursor }: OrganizationPagerProps) {
  const t = await getTranslations("admin.billing.organizations");
  if (!cursor && !nextCursor) return null;
  return (
    <div className="flex justify-end gap-2">
      {cursor ? (
        <Button asChild variant="outline" size="sm">
          <Link href={ROUTES.mothershipBilling}>{t("first")}</Link>
        </Button>
      ) : null}
      {nextCursor ? (
        <Button asChild variant="outline" size="sm">
          <Link href={{ pathname: ROUTES.mothershipBilling, query: { cursor: nextCursor } }}>
            {t("next")}
          </Link>
        </Button>
      ) : null}
    </div>
  );
}
