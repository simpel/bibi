import type { CustomerDto } from "@okazi/core";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@okazi/ui";
import { useTranslations } from "next-intl";
import { ArchiveCustomerForm } from "./archive-customer-form";

export type ArchiveCustomerDialogProps = {
  customer: CustomerDto;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Archive confirmation; with bookings, the form below asks to archive them too (#134). */
export function ArchiveCustomerDialog({
  customer,
  open,
  onOpenChange,
}: ArchiveCustomerDialogProps) {
  const t = useTranslations("customer");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("archive")}</DialogTitle>
          <DialogDescription>{t("archiveConfirm", { name: customer.name })}</DialogDescription>
        </DialogHeader>
        <ArchiveCustomerForm customer={customer} onClose={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}
