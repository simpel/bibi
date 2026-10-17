import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { parseSkillFilters } from "@/features/skill/skill-filters";
import { SkillList } from "@/features/skill/ui/skill-list";

type SkillsPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function SkillsPage({ params, searchParams }: SkillsPageProps) {
  const locale = resolveLocale({ value: (await params).locale });
  setRequestLocale(locale);
  const filters = parseSkillFilters({ params: await searchParams });
  return <SkillList locale={locale} filters={filters} />;
}
