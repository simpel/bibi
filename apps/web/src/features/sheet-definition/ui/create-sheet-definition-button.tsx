"use client";

import { Button } from "@okazi/ui";
import { PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { SheetDefinitionDialog } from "./sheet-definition-dialog";
import type { SheetOptions } from "./sheet-options";

export type CreateSheetDefinitionButtonProps = { options: SheetOptions };

/** Opens the create-sheet dialog. */
export function CreateSheetDefinitionButton({ options }: CreateSheetDefinitionButtonProps) {
  const t = useTranslations("sheetDefinition");
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <PlusIcon />
        {t("create")}
      </Button>
      <SheetDefinitionDialog options={options} open={open} onOpenChange={setOpen} />
    </>
  );
}
