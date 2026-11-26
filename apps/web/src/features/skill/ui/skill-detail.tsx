import type { Locale } from "@bibi/i18n";
import { getTranslations } from "next-intl/server";
import { MarkdownView } from "@/components/markdown-view";
import { CrumbName } from "@/components/shell/crumb-name";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { loadSkill } from "@/features/skill/load-skill";
import { canPermission } from "@/lib/can";
import { skillRoute } from "@/lib/routes";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { skillAbilities } from "../skill-abilities";
import { SkillActions } from "./skill-actions";
import { SkillDangerArea } from "./skill-danger-area";
import { SkillMeta } from "./skill-meta";
import { SkillResources } from "./skill-resources";
import { SkillTools } from "./skill-tools";

export type SkillDetailProps = { locale: Locale; id: string };

/** Skill page: description, instructions, allowed tools, resources, version, danger area. */
export async function SkillDetail({ locale, id }: SkillDetailProps) {
  const [t, result, abilities] = await Promise.all([
    getTranslations("skills"),
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
      {can.archive || can.restore ? (
        <SkillDangerArea skill={{ id: skill.id, name: skill.name, status: skill.status }} />
      ) : null}
    </div>
  );
}
