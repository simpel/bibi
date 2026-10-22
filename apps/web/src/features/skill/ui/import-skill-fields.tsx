"use client";

import { Input, Label } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { type ChangeEvent, useId } from "react";
import type { UseFormReturn } from "react-hook-form";
import { TextField } from "@/components/form/text-field";
import type { SkillImportInput, SkillImportValues } from "../skill-import-schema";
import { SkillScopeField } from "./skill-scope-field";

export type ImportSkillFieldsProps = {
  form: UseFormReturn<SkillImportValues, unknown, SkillImportInput>;
};

/** SKILL.md as a file upload or pasted text, and where the imported draft should live. */
export function ImportSkillFields({ form }: ImportSkillFieldsProps) {
  const t = useTranslations("skills");
  const fileId = useId();
  const onFile = async ({ event }: { event: ChangeEvent<HTMLInputElement> }) => {
    const file = event.target.files?.[0];
    if (file) form.setValue("markdown", await file.text(), { shouldValidate: true });
  };
  return (
    <>
      <div className="grid gap-2">
        <Label htmlFor={fileId}>{t("importFile")}</Label>
        <Input
          id={fileId}
          type="file"
          accept=".md,text/markdown,text/plain"
          onChange={(event) => void onFile({ event })}
        />
      </div>
      <TextField form={form} name="markdown" label={t("importMarkdown")} multiline rows={10} />
      <SkillScopeField form={form} disabled={false} hint={false} />
    </>
  );
}
