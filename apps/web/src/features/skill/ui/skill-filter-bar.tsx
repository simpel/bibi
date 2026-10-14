"use client";

import { Button, Form, Label, Switch } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useId } from "react";
import { useForm } from "react-hook-form";
import type { SkillFilters } from "../skill-filters";
import { SkillFilterSelects } from "./skill-filter-selects";
import { SkillSearchInput } from "./skill-search-input";
import { useSkillFilters } from "./use-skill-filters";

export type SkillFilterBarProps = { filters: SkillFilters };

type FilterValues = { q: string };

/**
 * Filters as URL state: scope, status, text query and the semantic switch (server re-renders).
 * A navigation form (CLAUDE.md "Formulär"): shadcn `Form`, no server action and no toast.
 */
export function SkillFilterBar({ filters }: SkillFilterBarProps) {
  const t = useTranslations("skills.filters");
  const semanticId = useId();
  const form = useForm<FilterValues>({ defaultValues: { q: filters.q ?? "" } });
  const apply = useSkillFilters({ filters });
  const query = () => form.getValues("q").trim() || undefined;
  return (
    <Form {...form}>
      <form
        aria-label={t("query")}
        className="flex flex-wrap items-end gap-3"
        onSubmit={form.handleSubmit(() => apply({ next: { q: query() } }))}
      >
        <SkillSearchInput form={form} />
        <SkillFilterSelects filters={filters} onChange={(next) => apply({ next })} />
        <div className="flex items-center gap-2">
          <Switch
            id={semanticId}
            checked={filters.semantic}
            onCheckedChange={(semantic) => apply({ next: { semantic, q: query() } })}
          />
          <Label htmlFor={semanticId}>{t("semantic")}</Label>
        </div>
        <Button type="submit" variant="outline">
          {t("apply")}
        </Button>
      </form>
    </Form>
  );
}
