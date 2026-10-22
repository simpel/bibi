"use client";

import { FormControl, FormController, FormItem, FormLabel, Input } from "@bibi/ui";
import { SearchIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";

export type SkillSearchInputProps = { form: UseFormReturn<{ q: string }> };

/** The text query field of the filter form (label for screen readers only). */
export function SkillSearchInput({ form }: SkillSearchInputProps) {
  const t = useTranslations("skills.filters");
  return (
    <FormController
      control={form.control}
      name="q"
      render={({ field }) => (
        <FormItem className="relative min-w-48 flex-1">
          <FormLabel className="sr-only">{t("query")}</FormLabel>
          <SearchIcon className="pointer-events-none absolute left-3 top-2.5 size-4 text-muted-foreground" />
          <FormControl>
            <Input type="search" placeholder={t("placeholder")} className="pl-9" {...field} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}
