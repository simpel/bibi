"use client";

import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import type { SkillFormValues } from "../skill-form-schema";
import type { SkillCreateInput } from "../skill-types";
import { SkillResourceFields } from "./skill-resource-fields";
import { SkillScopeField } from "./skill-scope-field";

export type SkillFormFieldsProps = {
  form: UseFormReturn<SkillFormValues, unknown, SkillCreateInput>;
  /** Editing: the scope cannot change. */
  editing: boolean;
};

export function SkillFormFields({ form, editing }: SkillFormFieldsProps) {
  const t = useTranslations("skills.fields");
  return (
    <div className="grid gap-4">
      <SkillScopeField form={form} disabled={editing} />
      <TextField form={form} name="name" label={t("name")} required />
      <TextField form={form} name="slug" label={t("slug")} />
      <TextField form={form} name="description" label={t("description")} multiline required />
      <TextField form={form} name="instructions" label={t("instructions")} multiline required />
      <TextField form={form} name="allowedTools" label={t("allowedTools")} multiline />
      <SkillResourceFields form={form} />
    </div>
  );
}
