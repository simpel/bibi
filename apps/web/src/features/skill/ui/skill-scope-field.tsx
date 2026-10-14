"use client";

import { FormField } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useId } from "react";
import { Controller, type UseFormReturn } from "react-hook-form";
import type { SkillFormValues } from "../skill-form-schema";
import type { SkillCreateInput } from "../skill-types";
import { SkillScopeSelect } from "./skill-scope-select";

export type SkillScopeFieldProps = {
  form: UseFormReturn<SkillFormValues, unknown, SkillCreateInput>;
  disabled: boolean;
};

/** Where the new skill lives: personal (just you) or the organization (needs an admin). */
export function SkillScopeField({ form, disabled }: SkillScopeFieldProps) {
  const t = useTranslations("skills.scope");
  const id = useId();
  return (
    <FormField id={id} label={t("label")} description={t("hint")}>
      <Controller
        control={form.control}
        name="scope"
        render={({ field }) => (
          <SkillScopeSelect
            id={id}
            value={field.value}
            onChange={field.onChange}
            disabled={disabled}
          />
        )}
      />
    </FormField>
  );
}
