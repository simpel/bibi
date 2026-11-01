import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { SkillEdit } from "@/features/skill/ui/skill-edit";

type EditSkillPageProps = { params: Promise<{ locale: string; id: string }> };

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
