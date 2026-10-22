"use client";

import { FormController, FormDescription, FormItem, FormLabel, FormMessage } from "@bibi/ui";
import { useTranslations } from "next-intl";
import type { FieldValues, Path, UseFormReturn } from "react-hook-form";
import type { SkillScopeChoice } from "../skill-types";
import { SkillScopeSelect } from "./skill-scope-select";

export type SkillScopeFieldProps<V extends FieldValues, O> = {
  /** A form with a `scope` field. */
  form: UseFormReturn<V, unknown, O>;
  disabled: boolean;
  /** Show the explanation under the select. */
  hint?: boolean;
};

/** Where the skill lives: personal (just you) or the organization (needs an admin). */
export function SkillScopeField<V extends FieldValues, O>({
  form,
  disabled,
  hint = true,
}: SkillScopeFieldProps<V, O>) {
  const t = useTranslations("skills.scope");
  return (
    <FormController
      control={form.control}
      name={"scope" as Path<V>}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{t("label")}</FormLabel>
          <SkillScopeSelect
            value={field.value as SkillScopeChoice}
            onChange={field.onChange}
            disabled={disabled}
          />
          {hint ? <FormDescription>{t("hint")}</FormDescription> : null}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
