"use client";

import type { VocabularyDto } from "@bibi/core";
import { useTranslations } from "next-intl";
import { ArchiveDangerArea } from "@/components/danger-area/archive-danger-area";
import { ArchiveVocabularyDialog } from "./archive-vocabulary-dialog";

export type VocabularyDangerAreaProps = { vocabulary: VocabularyDto };

/** The list's danger area, last on its page: the only place it is archived. */
export function VocabularyDangerArea({ vocabulary }: VocabularyDangerAreaProps) {
  const t = useTranslations("vocabulary");
  return (
    <ArchiveDangerArea
      label={t("archive")}
      description={t("archiveConfirm", { name: vocabulary.name })}
      dialog={(state) => <ArchiveVocabularyDialog vocabulary={vocabulary} {...state} />}
    />
  );
}
