"use client";

import type { RequirementDto } from "@okazi/core";
import { DataTableRowActions, DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { nameOf } from "@/components/form/named-option";
import { ArchiveRequirementDialog } from "./archive-requirement-dialog";
import { RequirementDialog } from "./requirement-dialog";
import type { RequirementFormData } from "./requirement-form-data";

export type RequirementRowActionsProps = { requirement: RequirementDto; data: RequirementFormData };

/** Edit the count or fields of one requirement, or remove it. */
export function RequirementRowActions({ requirement, data }: RequirementRowActionsProps) {
  const t = useTranslations("requirement");
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
      <RequirementDialog
        data={data}
        bookingId={requirement.bookingId}
        requirement={requirement}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <ArchiveRequirementDialog
        requirement={requirement}
        name={nameOf({ options: data.values, id: requirement.vocabularyValueId })}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
