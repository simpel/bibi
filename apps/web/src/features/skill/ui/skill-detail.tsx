import { getSkill } from "@okazi/core";
import type { Locale } from "@okazi/i18n";
import { Link } from "@okazi/i18n/navigation";
import { ArrowLeftIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { MarkdownView } from "@/components/markdown-view";
import { ErrorState } from "@/components/states/error-state";
import { PageHeader } from "@/components/states/page-header";
import { canPermission } from "@/lib/can";
import { ROUTES } from "@/lib/routes";
import { getCallerAbilities } from "@/server/caller-abilities";
import { handleLoadError } from "@/server/load-error";
import { runOperation } from "@/server/run-operation";
import { skillAbilities } from "../skill-abilities";
import { SkillActions } from "./skill-actions";
import { SkillMeta } from "./skill-meta";
import { SkillResources } from "./skill-resources";
import { SkillTools } from "./skill-tools";

export type SkillDetailProps = { locale: Locale; id: string };

/** Skill page: description, rendered instructions, allowed tools, resources, version, actions. */
export async function SkillDetail({ locale, id }: SkillDetailProps) {
  const t = await getTranslations("skills");
  const common = await getTranslations("common");
  const result = await runOperation({ operation: getSkill, input: { id } });
  if (!result.ok) return <ErrorState errorKey={handleLoadError({ error: result.error, locale })} />;
  const skill = result.value;
  const abilities = await getCallerAbilities();
  const can = skillAbilities({
    skill,
    admin: canPermission({ permissions: abilities.permissions, permission: "assistant:write" }),
  });
  return (
    <div className="grid gap-6">
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
        <h2 className="text-lg font-semibold">{t("sections.instructions")}</h2>
        <MarkdownView markdown={skill.instructions} />
      </section>
      <SkillTools tools={skill.allowedTools} />
      <SkillResources resources={skill.resources} />
    </div>
  );
}
