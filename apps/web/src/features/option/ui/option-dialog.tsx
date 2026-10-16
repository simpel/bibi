import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { OptionForm } from "./option-form";

export type OptionDialogProps = {
  itemId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function OptionDialog({ itemId, open, onOpenChange }: OptionDialogProps) {
  const t = useTranslations("option");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("create")}</DialogTitle>
          <DialogDescription>{t("formDescription")}</DialogDescription>
        </DialogHeader>
        <OptionForm itemId={itemId} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
