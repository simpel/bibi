"use client";

import { Button, Label, Switch } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import type { SkillFilters } from "../skill-filters";
import { SkillFilterSelects } from "./skill-filter-selects";
import { SkillSearchInput } from "./skill-search-input";
import { useSkillFilters } from "./use-skill-filters";

export type SkillFilterBarProps = { filters: SkillFilters };

/** Filters as URL state: scope, status, text query and the semantic switch (server re-renders). */
export function SkillFilterBar({ filters }: SkillFilterBarProps) {
  const t = useTranslations("skills.filters");
  const semanticId = useId();
  const [query, setQuery] = useState(filters.q ?? "");
  const apply = useSkillFilters({ filters });
  const q = query.trim() || undefined;
  return (
    <form
      aria-label={t("query")}
      className="flex flex-wrap items-end gap-3"
      onSubmit={(event) => {
        event.preventDefault();
        apply({ next: { q } });
      }}
    >
      <SkillSearchInput value={query} onChange={setQuery} />
      <SkillFilterSelects filters={filters} onChange={(next) => apply({ next })} />
      <div className="flex items-center gap-2">
        <Switch
          id={semanticId}
          checked={filters.semantic}
          onCheckedChange={(semantic) => apply({ next: { semantic, q } })}
        />
        <Label htmlFor={semanticId}>{t("semantic")}</Label>
      </div>
      <Button type="submit" variant="outline">
        {t("apply")}
      </Button>
    </form>
  );
}
