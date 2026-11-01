import { resolveLocale } from "@bibi/i18n";
import { SimplePage } from "@bibi/ui";
import { setRequestLocale } from "next-intl/server";
import { SkillCreate } from "@/features/skill/ui/skill-create";

type NewSkillPageProps = { params: Promise<{ locale: string }> };

export default async function NewSkillPage({ params }: NewSkillPageProps) {
  setRequestLocale(resolveLocale({ value: (await params).locale }));
  return (
    <SimplePage>
      <SkillCreate />
    </SimplePage>
  );
}
