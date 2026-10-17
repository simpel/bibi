"use client";

import { useTranslations } from "next-intl";
import { SelectFilter } from "@/components/select-filter";
import { scopeKey, statusKey } from "@/lib/skill-labels";
import { SKILL_SCOPES, SKILL_STATUSES, type SkillFilters } from "../skill-filters";

export type SkillFilterSelectsProps = {
  filters: SkillFilters;
  onChange: (next: Partial<SkillFilters>) => void;
};

/** Scope and status dropdowns. */
export function SkillFilterSelects({ filters, onChange }: SkillFilterSelectsProps) {
  const t = useTranslations("skills");
  return (
    <>
      <SelectFilter
        label={t("filters.scope")}
        allLabel={t("filters.allScopes")}
        value={filters.scope}
        options={SKILL_SCOPES.map((scope) => ({
          value: scope,
          label: t(`scope.${scopeKey({ scope })}`),
        }))}
        onChange={(value) => onChange({ scope: SKILL_SCOPES.find((scope) => scope === value) })}
      />
      <SelectFilter
        label={t("filters.status")}
        allLabel={t("filters.allStatuses")}
        value={filters.status}
        options={SKILL_STATUSES.map((status) => ({
          value: status,
          label: t(`status.${statusKey({ status })}`),
        }))}
        onChange={(value) =>
          onChange({ status: SKILL_STATUSES.find((status) => status === value) })
        }
      />
    </>
  );
}
