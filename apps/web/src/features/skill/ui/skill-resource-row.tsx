"use client";

import { Button, FormField, Input, Textarea } from "@okazi/ui";
import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import type { SkillFormValues } from "../skill-form-schema";
import type { SkillCreateInput } from "../skill-types";

export type SkillResourceRowProps = {
  form: UseFormReturn<SkillFormValues, unknown, SkillCreateInput>;
  index: number;
  onRemove: () => void;
};

/** One resource: name, content and a remove button. */
export function SkillResourceRow({ form, index, onRemove }: SkillResourceRowProps) {
  const t = useTranslations("skills.fields");
  return (
    <div className="grid gap-2 rounded-md border p-3">
      <FormField id={`resource-name-${index}`} label={t("resourceName")}>
        <Input id={`resource-name-${index}`} {...form.register(`resources.${index}.name`)} />
      </FormField>
      <FormField id={`resource-content-${index}`} label={t("resourceContent")}>
        <Textarea
          id={`resource-content-${index}`}
          rows={3}
          {...form.register(`resources.${index}.content`)}
        />
      </FormField>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="justify-self-end"
        onClick={onRemove}
      >
        <Trash2Icon />
        {t("removeResource")}
      </Button>
    </div>
  );
}
