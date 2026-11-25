"use client";

import type { EntityTypeDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { ArchiveDangerArea } from "@/components/danger-area/archive-danger-area";
import { ArchiveEntityTypeDialog } from "./archive-entity-type-dialog";

export type EntityTypeDangerAreaProps = { entityType: EntityTypeDto };

/** The type's danger area, last on its page: the only place it is archived. */
export function EntityTypeDangerArea({ entityType }: EntityTypeDangerAreaProps) {
  const t = useTranslations("entityType");
  return (
    <ArchiveDangerArea
      label={t("archive")}
      description={t("archiveConfirm", { name: entityType.name })}
      dialog={(state) => <ArchiveEntityTypeDialog entityType={entityType} {...state} />}
    />
  );
}
