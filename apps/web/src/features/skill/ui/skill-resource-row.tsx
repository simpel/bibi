"use client";

import { Button } from "@okazi/ui";
import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
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
      <TextField form={form} name={`resources.${index}.name`} label={t("resourceName")} />
      <TextField
        form={form}
        name={`resources.${index}.content`}
        label={t("resourceContent")}
        multiline
      />
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
