import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { loadSkill } from "@/features/skill/load-skill";
import { SkillDetail } from "@/features/skill/ui/skill-detail";
import { entityTitle } from "@/lib/page-metadata";

type SkillPageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: SkillPageProps) {
  const { id } = await params;
  const skill = await loadSkill({ id });
  return entityTitle({
    name: skill.ok ? skill.value.name : null,
    fallback: "Skill",
  });
}

export default async function SkillPage({ params }: SkillPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <SkillDetail locale={locale} id={id} />
    </SimplePage>
  );
}
