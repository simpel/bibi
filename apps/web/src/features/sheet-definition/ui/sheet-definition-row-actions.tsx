"use client";

import type { SheetDefinitionDto } from "@okazi/core";
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@okazi/ui";
import { MoreHorizontalIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { ArchiveSheetDefinitionDialog } from "./archive-sheet-definition-dialog";
import { SheetDefinitionDialog } from "./sheet-definition-dialog";
import type { SheetOptions } from "./sheet-options";

export type SheetDefinitionRowActionsProps = { sheet: SheetDefinitionDto; options: SheetOptions };

/** Edit / archive menu for one sheet definition. */
export function SheetDefinitionRowActions({ sheet, options }: SheetDefinitionRowActionsProps) {
  const t = useTranslations("sheetDefinition");
  const common = useTranslations("common");
  const [dialog, setDialog] = useState<"edit" | "archive" | null>(null);
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" aria-label={common("actions")}>
            <MoreHorizontalIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => setDialog("edit")}>{t("edit")}</DropdownMenuItem>
          <DropdownMenuItem destructive onSelect={() => setDialog("archive")}>
            {t("archive")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <SheetDefinitionDialog
        sheet={sheet}
        options={options}
        open={dialog === "edit"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
      <ArchiveSheetDefinitionDialog
        sheet={sheet}
        open={dialog === "archive"}
        onOpenChange={(open) => !open && setDialog(null)}
      />
    </>
  );
}
