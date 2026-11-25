"use client";

import type { RunSheetDefinitionDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { ArchiveDangerArea } from "@/components/danger-area/archive-danger-area";
import { ArchiveRunSheetDefinitionDialog } from "./archive-run-sheet-definition-dialog";

export type RunSheetDefinitionDangerAreaProps = { runSheet: RunSheetDefinitionDto };

/** The run sheet template's danger area, last on its page: the only place it is archived. */
export function RunSheetDefinitionDangerArea({ runSheet }: RunSheetDefinitionDangerAreaProps) {
  const t = useTranslations("runSheetDefinition");
  return (
    <ArchiveDangerArea
      label={t("archive")}
      description={t("archiveConfirm", { name: runSheet.name })}
      dialog={(state) => <ArchiveRunSheetDefinitionDialog runSheet={runSheet} {...state} />}
    />
  );
}
