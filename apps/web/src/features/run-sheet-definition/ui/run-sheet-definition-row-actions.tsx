"use client";

import type { RunSheetDefinitionDto } from "@bibi/core";
import { ContextMenuItem, DataTableRowActions } from "@bibi/ui";
import { PencilIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { RowAccess } from "@/lib/can";
import { Link, useRouter } from "@/lib/navigation";
import { listItemRoute, ROUTES, updateRoute } from "@/lib/routes";

/** The update page of one row. */
export const runSheetEditHref = ({ id }: { id: string }) =>
  updateRoute({ detail: listItemRoute({ list: ROUTES.adminRunSheets, id }) });

export type RunSheetDefinitionRowActionsProps = {
  runSheet: RunSheetDefinitionDto;
  access: RowAccess;
};

/** Edit for one run sheet definition; it is archived on its own page. */
export function RunSheetDefinitionRowActions({
  runSheet,
  access,
}: RunSheetDefinitionRowActionsProps) {
  const t = useTranslations("runSheetDefinition");
  const common = useTranslations("common");
  const router = useRouter();
  const editHref = runSheetEditHref({ id: runSheet.id });
  return (
    <DataTableRowActions
      label={common("actions")}
      primary={
        access.canEdit
          ? [{ label: t("edit"), icon: PencilIcon, onClick: () => router.push(editHref) }]
          : []
      }
    />
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
