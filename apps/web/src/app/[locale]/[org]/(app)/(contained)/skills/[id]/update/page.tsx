import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { loadSkill } from "@/features/skill/load-skill";
import { SkillEdit } from "@/features/skill/ui/skill-edit";
import { entityTitle } from "@/lib/page-metadata";

type EditSkillPageProps = { params: Promise<{ locale: string; id: string }> };

export async function generateMetadata({ params }: EditSkillPageProps) {
  const { id } = await params;
  const skill = await loadSkill({ id });
  return entityTitle({
    name: skill.ok ? skill.value.name : null,
    fallback: "Skill",
    prefix: "Edit",
  });
}

export default async function EditSkillPage({ params }: EditSkillPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return (
    <SimplePage>
      <SkillEdit locale={locale} id={id} />
    </SimplePage>
  );
}
