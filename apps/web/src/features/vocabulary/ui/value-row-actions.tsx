"use client";

import type { VocabularyValueDto } from "@bibi/core";
import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { ArchiveValueDialog } from "./archive-value-dialog";
import { ValueDialog } from "./value-dialog";

export type ValueRowActionsProps = {
  vocabularyId: string;
  value: VocabularyValueDto;
  access: RowAccess;
};

/** Rename / archive menu for one list value. */
export function ValueRowActions({ vocabularyId, value, access }: ValueRowActionsProps) {
  const t = useTranslations("vocabulary.value");
  const common = useTranslations("common");
  const [dialog, setDialog] = useState<"edit" | "archive" | null>(null);
  return (
    <>
      <DataTableRowActions
        label={common("actions")}
        primary={
          access.canEdit
            ? [{ label: t("edit"), icon: PencilIcon, onClick: () => setDialog("edit") }]
            : []
        }
      >
        {access.canRemove ? (
          <DropdownMenuItem destructive onSelect={() => setDialog("archive")}>
            {t("archive")}
          </DropdownMenuItem>
        ) : null}
      </DataTableRowActions>
      <ValueDialog
        vocabularyId={vocabularyId}
        value={value}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <ArchiveValueDialog
        value={value}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
