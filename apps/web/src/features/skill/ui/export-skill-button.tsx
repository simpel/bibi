"use client";

import { Button, toast } from "@okazi/ui";
import { DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { errorKeyForCode } from "@/lib/error-key";
import { exportSkillAction } from "../actions";
import { downloadText } from "./download-text";

export type ExportSkillButtonProps = { id: string };

/** Downloads the skill as SKILL.md (`skill.export`). */
export function ExportSkillButton({ id }: ExportSkillButtonProps) {
  const t = useTranslations("skills");
  const errors = useTranslations("errors");
  const [pending, startTransition] = useTransition();
  const onClick = () =>
    startTransition(async () => {
      const result = await exportSkillAction({ id });
      if (!result.ok) return void toast.error(errors(errorKeyForCode({ code: result.error.code })));
      downloadText({ text: result.value.markdown, filename: result.value.filename });
      toast.success(t("exported"));
    });
  return (
    <Button variant="outline" disabled={pending} onClick={onClick}>
      <DownloadIcon />
      {t("export")}
    </Button>
  );
}
