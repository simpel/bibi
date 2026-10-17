import { resolveLocale } from "@okazi/i18n";
import { setRequestLocale } from "next-intl/server";
import { SkillDetail } from "@/features/skill/ui/skill-detail";

type SkillPageProps = { params: Promise<{ locale: string; id: string }> };

export default async function SkillPage({ params }: SkillPageProps) {
  const { locale: rawLocale, id } = await params;
  const locale = resolveLocale({ value: rawLocale });
  setRequestLocale(locale);
  return <SkillDetail locale={locale} id={id} />;
}
