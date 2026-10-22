"use client";

import type { RequirementDto } from "@bibi/core";
import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { nameOf } from "@/components/form/named-option";
import type { RowAccess } from "@/lib/can";
import { ArchiveRequirementDialog } from "./archive-requirement-dialog";
import { RequirementDialog } from "./requirement-dialog";
import type { RequirementFormData } from "./requirement-form-data";

export type RequirementRowActionsProps = {
  requirement: RequirementDto;
  data: RequirementFormData;
  access: RowAccess;
};

/** Edit the count or fields of one requirement, or remove it. */
export function RequirementRowActions({ requirement, data, access }: RequirementRowActionsProps) {
  const t = useTranslations("requirement");
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
      <RequirementDialog
        data={data}
        ticketId={requirement.ticketId}
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
