import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { ChooseOptionsForm } from "./choose-options-form";
import type { CustomisableItem } from "./program-form-data";

export type ChooseOptionsDialogProps = {
  lineId: string;
  item: CustomisableItem;
  chosen: readonly string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Chooses a line's options among its item's customisation groups (like line edit). */
export function ChooseOptionsDialog({ open, onOpenChange, ...props }: ChooseOptionsDialogProps) {
  const t = useTranslations("line");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("chooseOptions")}</DialogTitle>
          <DialogDescription>{t("chooseOptionsDescription")}</DialogDescription>
        </DialogHeader>
        {open ? <ChooseOptionsForm {...props} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}
