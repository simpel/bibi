import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { SkillDetail } from "@/features/skill/ui/skill-detail";

type SkillPageProps = { params: Promise<{ locale: string; id: string }> };

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
