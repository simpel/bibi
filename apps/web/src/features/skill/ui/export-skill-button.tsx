"use client";

import { Button } from "@bibi/ui";
import { DownloadIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { downloadText } from "@/lib/download-text";
import { useToastAction } from "@/lib/use-toast-action";
import { exportSkillAction } from "../actions";

export type ExportSkillButtonProps = { id: string };

/** Downloads the skill as SKILL.md (`skill.export`). */
export function ExportSkillButton({ id }: ExportSkillButtonProps) {
  const t = useTranslations("skills");
  const common = useTranslations("common");
  const { run, pending } = useToastAction();
  const onClick = () =>
    run({
      action: () => exportSkillAction({ id }),
      messages: { pending: common("sending"), success: t("exported") },
      onSuccess: ({ value }) => downloadText({ text: value.markdown, filename: value.filename }),
    });
  return (
    <Button variant="outline" disabled={pending} onClick={onClick}>
      <DownloadIcon />
      {t("export")}
    </Button>
  );
}
