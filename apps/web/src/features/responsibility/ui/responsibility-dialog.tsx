import type { ResponsibilityDto } from "@okazi/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { ResponsibilityForm } from "./responsibility-form";
import type { ResponsibilityOptions } from "./responsibility-options";

export type ResponsibilityDialogProps = {
  /** Present = edit mode, absent = create mode. */
  responsibility?: ResponsibilityDto | undefined;
  options: ResponsibilityOptions;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ResponsibilityDialog({
  responsibility,
  options,
  open,
  onOpenChange,
}: ResponsibilityDialogProps) {
  const t = useTranslations("responsibility");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{responsibility ? t("edit") : t("create")}</DialogTitle>
          <DialogDescription>
            {responsibility ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <ResponsibilityForm
          responsibility={responsibility}
          options={options}
          onDone={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
