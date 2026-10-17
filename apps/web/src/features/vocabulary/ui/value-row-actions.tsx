"use client";

import type { VocabularyValueDto } from "@okazi/core";
import { DataTableRowActions, DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArchiveValueDialog } from "./archive-value-dialog";
import { ValueDialog } from "./value-dialog";

export type ValueRowActionsProps = { vocabularyId: string; value: VocabularyValueDto };

/** Rename / archive menu for one list value. */
export function ValueRowActions({ vocabularyId, value }: ValueRowActionsProps) {
  const t = useTranslations("vocabulary.value");
  const common = useTranslations("common");
  const [dialog, setDialog] = useState<"edit" | "archive" | null>(null);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        <DropdownMenuItem onSelect={() => setDialog("edit")}>{t("edit")}</DropdownMenuItem>
        <DropdownMenuItem destructive onSelect={() => setDialog("archive")}>
          {t("archive")}
        </DropdownMenuItem>
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
