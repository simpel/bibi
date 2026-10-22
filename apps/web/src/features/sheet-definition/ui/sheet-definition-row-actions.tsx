"use client";

import type { SheetDefinitionDto } from "@bibi/core";
import { DataTableRowActions, DropdownMenuItem } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import type { RowAccess } from "@/lib/can";
import { Link } from "@/lib/navigation";
import { listItemRoute, ROUTES, updateRoute } from "@/lib/routes";
import { ArchiveSheetDefinitionDialog } from "./archive-sheet-definition-dialog";

export type SheetDefinitionRowActionsProps = { sheet: SheetDefinitionDto; access: RowAccess };

/** Edit / archive menu for one sheet definition. */
export function SheetDefinitionRowActions({ sheet, access }: SheetDefinitionRowActionsProps) {
  const t = useTranslations("sheetDefinition");
  const common = useTranslations("common");
  const [archiving, setArchiving] = useState(false);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        {access.canEdit ? (
          <DropdownMenuItem asChild>
            <Link
              href={updateRoute({
                detail: listItemRoute({ list: ROUTES.settingsSheets, id: sheet.id }),
              })}
            >
              {t("edit")}
            </Link>
          </DropdownMenuItem>
        ) : null}
        {access.canRemove ? (
          <DropdownMenuItem destructive onSelect={() => setArchiving(true)}>
            {t("archive")}
          </DropdownMenuItem>
        ) : null}
      </DataTableRowActions>
      <ArchiveSheetDefinitionDialog sheet={sheet} open={archiving} onOpenChange={setArchiving} />
    </>
  );
}
