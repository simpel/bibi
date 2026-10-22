"use client";

import { FormControl, FormController, FormItem, FormLabel, Input } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type { NewOrganizationValues } from "./new-organization-schema";
import { SlugStatus } from "./slug-status";
import type { SlugCheckState } from "./use-slug-check";

export type SlugFieldProps = {
  form: UseFormReturn<NewOrganizationValues>;
  check: SlugCheckState;
  /** The user typed or picked a slug: it stops following the name. */
  onTake: ({ value }: { value: string }) => void;
};

/** `bibi.se/<slug>` with the live check under it (ADR 0062). */
export function SlugField({ form, check, onTake }: SlugFieldProps) {
  const t = useTranslations("welcome.new");
  return (
    <FormController
      control={form.control}
      name="slug"
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("slug")}</FormLabel>
          <div className="flex items-center rounded-md border focus-within:ring-2 focus-within:ring-ring">
            <span className="pl-3 text-sm text-muted-foreground">{t("slugPrefix")}</span>
            <FormControl>
              <Input
                {...field}
                className="border-0 pl-0.5 shadow-none focus-visible:ring-0"
                autoCapitalize="none"
                spellCheck={false}
                onChange={(event) => onTake({ value: event.target.value.toLowerCase() })}
              />
            </FormControl>
          </div>
          {field.value ? <SlugStatus check={check} onUse={onTake} /> : null}
        </FormItem>
      )}
    />
  );
}
