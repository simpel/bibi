"use client";

import type { VocabularyDto } from "@bibi/core";
import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { ArchiveVocabularyDialog } from "./archive-vocabulary-dialog";
import { VocabularyDialog } from "./vocabulary-dialog";

export type VocabularyRowActionsProps = {
  vocabulary: VocabularyDto;
  redirectToList?: boolean;
  access: RowAccess;
};

/** Rename / archive menu for one list. */
export function VocabularyRowActions({
  vocabulary,
  redirectToList,
  access,
}: VocabularyRowActionsProps) {
  const t = useTranslations("vocabulary");
  const common = useTranslations("common");
  const [dialog, setDialog] = useState<"edit" | "archive" | null>(null);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        {access.canEdit ? (
          <DropdownMenuItem onSelect={() => setDialog("edit")}>{t("edit")}</DropdownMenuItem>
        ) : null}
        {access.canRemove ? (
          <DropdownMenuItem destructive onSelect={() => setDialog("archive")}>
            {t("archive")}
          </DropdownMenuItem>
        ) : null}
      </DataTableRowActions>
      <VocabularyDialog
        vocabulary={vocabulary}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <ArchiveVocabularyDialog
        vocabulary={vocabulary}
        redirectToList={redirectToList}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
