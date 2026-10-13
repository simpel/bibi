"use client";

import { FormField, Input, Textarea } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { type ChangeEvent, useId } from "react";
import type { SkillScopeChoice } from "../skill-types";
import { SkillScopeSelect } from "./skill-scope-select";

export type ImportSkillFieldsProps = {
  markdown: string;
  scope: SkillScopeChoice;
  onMarkdown: (markdown: string) => void;
  onScope: (scope: SkillScopeChoice) => void;
};

/** SKILL.md as a file upload or pasted text, and where the imported draft should live. */
export function ImportSkillFields({
  markdown,
  scope,
  onMarkdown,
  onScope,
}: ImportSkillFieldsProps) {
  const t = useTranslations("skills");
  const id = useId();
  const onFile = async ({ event }: { event: ChangeEvent<HTMLInputElement> }) => {
    const file = event.target.files?.[0];
    if (file) onMarkdown(await file.text());
  };
  return (
    <>
      <FormField id={`${id}-file`} label={t("importFile")}>
        <Input
          id={`${id}-file`}
          type="file"
          accept=".md,text/markdown,text/plain"
          onChange={(event) => void onFile({ event })}
        />
      </FormField>
      <FormField id={`${id}-markdown`} label={t("importMarkdown")}>
        <Textarea
          id={`${id}-markdown`}
          rows={10}
          className="font-mono text-xs"
          value={markdown}
          onChange={(event) => onMarkdown(event.target.value)}
        />
      </FormField>
      <FormField id={`${id}-scope`} label={t("scope.label")}>
        <SkillScopeSelect id={`${id}-scope`} value={scope} onChange={onScope} />
      </FormField>
    </>
  );
}
