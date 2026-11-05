import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { loadSkill } from "@/features/skill/load-skill";
import { skillRoute } from "@/lib/routes";
import { handleLoadError } from "@/server/load-error";
import { SkillForm } from "./skill-form";

export type SkillEditProps = { locale: Locale; id: string };

/** `/skills/[id]/update`: the edit form for a skill the user may change. */
export async function SkillEdit({ locale, id }: SkillEditProps) {
  const [t, result] = await Promise.all([getTranslations("skills"), loadSkill({ id })]);
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  return (
    <div className="grid gap-6">
      <CrumbName href={skillRoute({ id })} name={result.value.name} />
      <PageHeader title={t("edit")} description={result.value.name} />
      <SkillForm skill={result.value} />
    </div>
  );
}
