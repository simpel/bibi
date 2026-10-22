"use client";

import { Badge, Card, CardContent, CardHeader, CardTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { MarkdownView } from "@/components/markdown-view";
import { SkillBadges } from "@/features/skill/ui/skill-badges";
import { Link } from "@/lib/navigation";
import { skillRoute } from "@/lib/routes";
import type { GenerativeProps } from "./generative-props";

export type SkillCardViewProps = GenerativeProps<"skill-card">;

/** One skill: name + version, scope/status, description, instructions and allowed tools. */
export function SkillCardView({ skill }: SkillCardViewProps) {
  const t = useTranslations("skills");
  const tools = skill.allowedTools ?? skill.activeTools ?? [];
  return (
    <Card data-slot="skill-card" className="shadow-none">
      <CardHeader className="gap-2 p-4 pb-2">
        <CardTitle className="text-base">
          <Link href={skillRoute({ id: skill.id })} className="hover:underline">
            {skill.name}
          </Link>{" "}
          <span className="font-sans text-xs font-normal text-muted-foreground">
            {t("version", { version: skill.version })}
          </span>
        </CardTitle>
        <SkillBadges scope={skill.scope} status={skill.status} />
      </CardHeader>
      <CardContent className="grid gap-2 p-4 pt-0 text-sm">
        {skill.description ? <p className="text-muted-foreground">{skill.description}</p> : null}
        {skill.instructions ? <MarkdownView markdown={skill.instructions} /> : null}
        {tools.length > 0 ? (
          <ul className="flex flex-wrap gap-1" aria-label={t("allowedTools")}>
            {tools.map((tool) => (
              <li key={tool}>
                <Badge variant="secondary" className="font-mono">
                  {tool}
                </Badge>
              </li>
            ))}
          </ul>
        ) : null}
      </CardContent>
    </Card>
  );
}
