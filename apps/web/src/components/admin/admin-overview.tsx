import { Card, PageContainer, PageSection } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { AdminGroup, AdminPage } from "@/components/shell/admin-items";
import { adminSectionHref } from "@/components/shell/admin-search-index";
import { PageHeader } from "@/components/states/page-header";
import { Link } from "@/lib/navigation";

export type AdminOverviewProps = {
  /** The groups and pages the caller may view, from `visibleAdminGroups`. */
  groups: readonly AdminGroup[];
};

/**
 * The administration area's start page (`/admin`): every page the caller may view, grouped like
 * the sidebar, each card listing its sections as links to their place on the page.
 */
export function AdminOverview({ groups }: AdminOverviewProps) {
  const nav = useTranslations("nav");
  const t = useTranslations("adminArea.overview");
  return (
    <PageSection>
      <PageContainer className="grid gap-10 py-8 sm:py-10">
        <PageHeader title={nav("admin")} description={t("description")} />
        {groups.map((group) => (
          <section
            key={group.id}
            aria-labelledby={`admin-group-${group.id}`}
            className="grid gap-4"
          >
            <h2 id={`admin-group-${group.id}`} className="text-xl">
              {nav(`adminGroups.${group.id}`)}
            </h2>
            <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {group.pages.map((page) => (
                <AdminOverviewCard key={page.key} page={page} />
              ))}
            </ul>
          </section>
        ))}
      </PageContainer>
    </PageSection>
  );
}

function AdminOverviewCard({ page }: { page: AdminPage }) {
  const nav = useTranslations("nav");
  const entries = useTranslations("adminArea.search.entries");
  const { key, icon: Icon, href, sections } = page;
  return (
    <li>
      <Card className="relative grid h-full content-start gap-3 p-5 transition-colors hover:bg-muted/50">
        <Link
          href={href}
          className="flex items-center gap-3 font-medium after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-muted-foreground">
            <Icon className="size-4" aria-hidden />
          </span>
          {nav(key)}
        </Link>
        <ul className="relative z-10 flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
          {sections.map((section) => (
            <li key={section.id}>
              <Link
                href={adminSectionHref({ entry: { href, anchor: section.anchor } })}
                className="hover:text-foreground hover:underline"
              >
                {entries(`${section.id}.label`)}
              </Link>
            </li>
          ))}
        </ul>
      </Card>
    </li>
  );
}
