"use client";

import { Button } from "@bibi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { type UseFormReturn, useFieldArray } from "react-hook-form";
import type { SkillFormValues } from "../skill-form-schema";
import type { SkillCreateInput } from "../skill-types";
import { SkillResourceRow } from "./skill-resource-row";

export type SkillResourceFieldsProps = {
  form: UseFormReturn<SkillFormValues, unknown, SkillCreateInput>;
};

/** Small named text resources (checklists, templates) attached to the skill. */
export function SkillResourceFields({ form }: SkillResourceFieldsProps) {
  const t = useTranslations("skills.fields");
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "resources" });
  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-medium">{t("resources")}</legend>
      <p className="text-sm text-muted-foreground">{t("resourcesHint")}</p>
      {fields.map((field, index) => (
        <SkillResourceRow key={field.id} form={form} index={index} onRemove={() => remove(index)} />
      ))}
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="justify-self-start"
        onClick={() => append({ name: "", content: "" })}
      >
        <PlusIcon />
        {t("addResource")}
      </Button>
    </fieldset>
  );
}
