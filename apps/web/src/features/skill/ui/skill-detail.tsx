import type { Locale } from "@bibi/i18n";
import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { MarkdownView } from "@/components/markdown-view";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { loadSkill } from "@/features/skill/load-skill";
import { canPermission } from "@/lib/can";
import { Link } from "@/lib/navigation";
import { ROUTES, skillRoute } from "@/lib/routes";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { skillAbilities } from "../skill-abilities";
import { SkillActions } from "./skill-actions";
import { SkillMeta } from "./skill-meta";
import { SkillResources } from "./skill-resources";
import { SkillTools } from "./skill-tools";

export type SkillDetailProps = { locale: Locale; id: string };

/** Skill page: description, rendered instructions, allowed tools, resources, version, actions. */
export async function SkillDetail({ locale, id }: SkillDetailProps) {
  const [t, common, result, abilities] = await Promise.all([
    getTranslations("skills"),
    getTranslations("common"),
    loadSkill({ id }),
    getCallerAbilities(),
  ]);
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const skill = result.value;
  const can = skillAbilities({
    skill,
    admin: canPermission({ permissions: abilities.permissions, permission: "assistant:write" }),
  });
  return (
    <div className="grid gap-6">
      <CrumbName href={skillRoute({ id })} name={skill.name} />
      <Link
        href={ROUTES.skills}
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeftIcon className="size-4" />
        {common("back")}
      </Link>
      <PageHeader
        title={skill.name}
        description={skill.description}
        actions={<SkillActions skill={{ id: skill.id, name: skill.name }} can={can} />}
      />
      <SkillMeta skill={skill} />
      <section className="grid gap-2">
        <h2 className="text-xl">{t("sections.instructions")}</h2>
        <MarkdownView markdown={skill.instructions} />
      </section>
      <SkillTools tools={skill.allowedTools} />
      <SkillResources resources={skill.resources} />
    </div>
  );
}
