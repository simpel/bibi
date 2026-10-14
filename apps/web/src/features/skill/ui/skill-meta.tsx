import type { SkillDto } from "@okazi/core";
import { Badge } from "@okazi/ui";
import { getTranslations } from "next-intl/server";
import { SkillBadges } from "./skill-badges";

export type SkillMetaProps = { skill: SkillDto };

/** Scope, status, version and slug of a skill. */
export async function SkillMeta({ skill }: SkillMetaProps) {
  const t = await getTranslations("skills");
  return (
    <div className="flex flex-wrap items-center gap-2">
      <SkillBadges scope={skill.scope} status={skill.status} />
      <Badge variant="outline">{t("version", { version: skill.version })}</Badge>
      <Badge variant="outline" className="font-mono">
        {skill.slug}
      </Badge>
    </div>
  );
}
