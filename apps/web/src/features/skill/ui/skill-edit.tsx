import { getSkill } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { getTranslations } from "next-intl/server";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { SkillForm } from "./skill-form";

export type SkillEditProps = { locale: Locale; id: string };

/** `/skills/[id]/edit`: the edit form for a skill the user may change. */
export async function SkillEdit({ locale, id }: SkillEditProps) {
  const t = await getTranslations("skills");
  const result = await runOperation({ operation: getSkill, input: { id } });
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  return (
    <div className="grid gap-6">
      <PageHeader title={t("edit")} description={result.value.name} />
      <SkillForm skill={result.value} />
    </div>
  );
}
