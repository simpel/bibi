import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { parseSkillFilters } from "@/features/skill/skill-filters";
import { SkillList } from "@/features/skill/ui/skill-list";
import { pageTitle } from "@/lib/page-metadata";

type SkillsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({ params }: SkillsPageProps) {
  const { locale } = await params;
  return pageTitle({ locale, namespace: "nav", key: "skills" });
}

export default async function SkillsPage({ params, searchParams }: SkillsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const filters = parseSkillFilters({ params: await searchParams });
  return (
    <SimplePage>
      <SkillList locale={locale} filters={filters} />
    </SimplePage>
  );
}
