"use client";

import type { RunSheetDefinitionDto } from "@bibi/core";
import { ContextMenuItem, DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { Link, useRouter } from "@/lib/navigation";
import { listItemRoute, ROUTES, updateRoute } from "@/lib/routes";
import { ArchiveRunSheetDefinitionDialog } from "./archive-run-sheet-definition-dialog";

/** The update page of one row. */
export const runSheetEditHref = ({ id }: { id: string }) =>
  updateRoute({ detail: listItemRoute({ list: ROUTES.adminRunSheets, id }) });

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
  const editHref = runSheetEditHref({ id: runSheet.id });
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

export type RunSheetDefinitionRowMenuProps = { runSheet: RunSheetDefinitionDto; access: RowAccess };

/** Right-click menu for a row: the edit page. */
export function RunSheetDefinitionRowMenu({ runSheet, access }: RunSheetDefinitionRowMenuProps) {
  const t = useTranslations("runSheetDefinition");
  if (!access.canEdit) return null;
  return (
    <ContextMenuItem asChild>
      <Link href={runSheetEditHref({ id: runSheet.id })}>{t("edit")}</Link>
    </ContextMenuItem>
  );
}
