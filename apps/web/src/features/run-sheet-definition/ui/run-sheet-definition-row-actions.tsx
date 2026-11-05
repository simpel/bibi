"use client";

import type { RunSheetDefinitionDto } from "@bibi/core";
import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { useRouter } from "@/lib/navigation";
import { listItemRoute, ROUTES, updateRoute } from "@/lib/routes";
import { ArchiveRunSheetDefinitionDialog } from "./archive-run-sheet-definition-dialog";

export type RunSheetDefinitionRowActionsProps = {
  runSheet: RunSheetDefinitionDto;
  access: RowAccess;
};

/** Edit / archive menu for one run sheet definition. */
export function RunSheetDefinitionRowActions({
  runSheet,
  access,
}: RunSheetDefinitionRowActionsProps) {
  const t = useTranslations("runSheetDefinition");
  const common = useTranslations("common");
  const [archiving, setArchiving] = useState(false);
  const router = useRouter();
  const editHref = updateRoute({
    detail: listItemRoute({ list: ROUTES.settingsRunSheets, id: runSheet.id }),
  });
  return (
    <>
      <DataTableRowActions
        label={common("actions")}
        primary={
          access.canEdit
            ? [{ label: t("edit"), icon: PencilIcon, onClick: () => router.push(editHref) }]
            : []
        }
      >
        {access.canRemove ? (
          <DropdownMenuItem destructive onSelect={() => setArchiving(true)}>
            {t("archive")}
          </DropdownMenuItem>
        ) : null}
      </DataTableRowActions>
      <ArchiveRunSheetDefinitionDialog
        runSheet={runSheet}
        open={archiving}
        onOpenChange={setArchiving}
      />
    </>
  );
}
