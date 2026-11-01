import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@bibi/ui";
import { useTranslations } from "next-intl";
import { AccountEditForm, type AccountEditFormProps } from "./account-edit-form";

export type AccountDialogProps = Omit<AccountEditFormProps, "onDone"> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Edit one row (`target`) or add a revenue account for an item type (`choices`). */
export function AccountDialog({ open, onOpenChange, ...form }: AccountDialogProps) {
  const t = useTranslations("finance.accounting");
  const adding = !form.target;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{adding ? t("add") : t("edit")}</DialogTitle>
          <DialogDescription>
            {adding ? t("revenueByTypeHint") : t("editDescription")}
          </DialogDescription>
        </DialogHeader>
        <AccountEditForm {...form} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
