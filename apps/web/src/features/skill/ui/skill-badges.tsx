"use client";

import { Badge } from "@bibi/ui";
import { useTranslations } from "next-intl";
import {
  type SkillScopeValue,
  type SkillStatusValue,
  scopeKey,
  statusKey,
  statusVariant,
} from "@/lib/skill-labels";

export type SkillBadgesProps = {
  scope?: SkillScopeValue | undefined;
  status?: SkillStatusValue | undefined;
};

/** Scope and (when known) lifecycle status of a skill. */
export function SkillBadges({ scope, status }: SkillBadgesProps) {
  const t = useTranslations("skills");
  return (
    <span className="flex flex-wrap gap-1">
      {scope ? <Badge variant="outline">{t(`scope.${scopeKey({ scope })}`)}</Badge> : null}
      {status ? (
        <Badge variant={statusVariant({ status })}>{t(`status.${statusKey({ status })}`)}</Badge>
      ) : null}
    </span>
  );
}
