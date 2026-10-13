import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { CursorPagination } from "@/components/cursor-pagination";
import { EmptyState } from "@/components/states/empty-state";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { ROUTES } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { loadSkills } from "../load-skills";
import { type SkillFilters, skillFilterQuery } from "../skill-filters";
import { SkillFilterBar } from "./skill-filter-bar";
import { SkillListActions } from "./skill-list-actions";
import { SkillTable } from "./skill-table";

export type SkillListProps = { locale: Locale; filters: SkillFilters };

/** Skills page body: filters (scope, status, text or semantic query), table, pagination. */
export async function SkillList({ locale, filters }: SkillListProps) {
  const t = await getTranslations("skills");
  const result = await loadSkills({ filters });
  const header = (
    <PageHeader
      title={t("title")}
      description={t("listDescription")}
      actions={<SkillListActions />}
    />
  );
  if (!result.ok) {
    const errorKey = handleLoadError({ error: result.error, locale });
    return <ErrorLayout header={header} errorKey={errorKey} />;
  }
  const { items, nextCursor } = result.value;
  return (
    <div className="grid gap-6">
      {header}
      <SkillFilterBar filters={filters} />
      {items.length === 0 ? (
        <EmptyState title={t("empty")} description={t("emptyDescription")} />
      ) : (
        <SkillTable skills={items} />
      )}
      <CursorPagination
        pathname={ROUTES.skills}
        cursor={filters.cursor}
        nextCursor={nextCursor}
        query={skillFilterQuery({ filters })}
      />
    </div>
  );
}

type ErrorLayoutProps = {
  header: React.ReactNode;
  errorKey: Parameters<typeof ErrorState>[0]["errorKey"];
};

function ErrorLayout({ header, errorKey }: ErrorLayoutProps) {
  return (
    <div className="grid gap-6">
      {header}
      <ErrorState errorKey={errorKey} />
    </div>
  );
}
