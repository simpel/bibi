import type { CustomerDto } from "@okazi/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import type { TypedFormData } from "@/components/typed-fields/typed-form-data";
import { CustomerForm } from "./customer-form";

export type CustomerDialogProps = {
  data: TypedFormData;
  /** Present = edit mode, absent = create mode. */
  customer?: CustomerDto | undefined;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CustomerDialog({ open, onOpenChange, customer, data }: CustomerDialogProps) {
  const t = useTranslations("customer");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{customer ? t("edit") : t("create")}</DialogTitle>
          <DialogDescription>
            {customer ? t("editDescription") : t("createDescription")}
          </DialogDescription>
        </DialogHeader>
        <CustomerForm data={data} customer={customer} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
