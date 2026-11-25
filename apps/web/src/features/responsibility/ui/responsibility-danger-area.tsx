"use client";

import type { ResponsibilityDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { ArchiveDangerArea } from "@/components/danger-area/archive-danger-area";
import { ArchiveResponsibilityDialog } from "./archive-responsibility-dialog";

export type ResponsibilityDangerAreaProps = { responsibility: ResponsibilityDto };

/** The responsibility's danger area, last on its page: the only place it is archived. */
export function ResponsibilityDangerArea({ responsibility }: ResponsibilityDangerAreaProps) {
  const t = useTranslations("responsibility");
  return (
    <ArchiveDangerArea
      label={t("archive")}
      description={t("archiveConfirm", { name: responsibility.name })}
      dialog={(state) => <ArchiveResponsibilityDialog responsibility={responsibility} {...state} />}
    />
  );
}
