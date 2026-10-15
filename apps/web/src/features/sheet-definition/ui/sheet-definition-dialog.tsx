import type { SheetDefinitionDto } from "@okazi/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { SheetDefinitionForm } from "./sheet-definition-form";
import type { SheetOptions } from "./sheet-options";

export type SheetDefinitionDialogProps = {
  /** Present = edit mode, absent = create mode. */
  sheet?: SheetDefinitionDto | undefined;
  options: SheetOptions;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function SheetDefinitionDialog({
  sheet,
  options,
  open,
  onOpenChange,
}: SheetDefinitionDialogProps) {
  const t = useTranslations("sheetDefinition");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{sheet ? t("edit") : t("create")}</DialogTitle>
          <DialogDescription>
            {sheet ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <SheetDefinitionForm sheet={sheet} options={options} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
