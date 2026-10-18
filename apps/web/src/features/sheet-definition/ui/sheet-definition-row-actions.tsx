"use client";

import type { SheetDefinitionDto } from "@okazi/core";
import { Link } from "@okazi/i18n/navigation";
import { DataTableRowActions, DropdownMenuItem } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { listItemRoute, ROUTES, updateRoute } from "@/lib/routes";
import { ArchiveSheetDefinitionDialog } from "./archive-sheet-definition-dialog";

export type SheetDefinitionRowActionsProps = { sheet: SheetDefinitionDto };

/** Edit / archive menu for one sheet definition. */
export function SheetDefinitionRowActions({ sheet }: SheetDefinitionRowActionsProps) {
  const t = useTranslations("sheetDefinition");
  const common = useTranslations("common");
  const [archiving, setArchiving] = useState(false);
  return (
    <>
      <DataTableRowActions label={common("actions")}>
        <DropdownMenuItem asChild>
          <Link
            href={updateRoute({
              detail: listItemRoute({ list: ROUTES.settingsSheets, id: sheet.id }),
            })}
          >
            {t("edit")}
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem destructive onSelect={() => setArchiving(true)}>
          {t("archive")}
        </DropdownMenuItem>
      </DataTableRowActions>
      <ArchiveSheetDefinitionDialog sheet={sheet} open={archiving} onOpenChange={setArchiving} />
    </>
  );
}
